use alloy_primitives::{Address, U256};
use alloc::{string::String, vec::Vec};
use stylus_sdk::{evm, msg, prelude::*, storage::StorageMap};

use crate::adapters::{BridgeRoute, IBridgeAdapter};

/// Across Protocol Spoke Pool Interface
sol_interface! {
    interface ISpokePool {
        function deposit(
            address recipient,
            address originToken,
            uint256 amount,
            uint256 destinationChainId,
            uint64 relayerFeePct,
            uint32 quoteTimestamp
        ) external payable;
    }
}

#[storage]
pub struct AcrossBridgeAdapter {
    owner: Address,
    // Spoke pool contract address (single pool handles all tokens)
    spoke_pool: Address,
    supported_tokens: StorageMap<Address, bool>,
    min_amounts: StorageMap<Address, U256>,
    // Relayer fee percentage in basis points (e.g., 15 = 0.15%)
    relayer_fee_bps: U256,
}

impl AcrossBridgeAdapter {
    pub fn new(spoke_pool: Address) -> Self {
        let mut instance = Self::default();
        instance.owner = msg::sender();
        instance.spoke_pool = spoke_pool;
        instance.relayer_fee_bps = U256::from(15); // 0.15% default
        instance
    }

    pub fn add_supported_token(
        &mut self,
        token: Address,
        min_amount: U256,
    ) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(token != Address::ZERO, "Invalid token");

        self.supported_tokens.insert(token, true);
        self.min_amounts.insert(token, min_amount);
        Ok(())
    }

    pub fn set_spoke_pool(&mut self, spoke_pool: Address) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(spoke_pool != Address::ZERO, "Invalid spoke pool");
        self.spoke_pool = spoke_pool;
        Ok(())
    }

    pub fn set_relayer_fee(&mut self, fee_bps: U256) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(fee_bps <= U256::from(1000), "Fee too high"); // Max 10%
        self.relayer_fee_bps = fee_bps;
        Ok(())
    }

    fn calculate_relayer_fee(&self, amount: U256) -> U256 {
        amount
            .saturating_mul(self.relayer_fee_bps)
            .saturating_div(U256::from(10000))
    }
}

impl IBridgeAdapter for AcrossBridgeAdapter {
    fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>> {
        Ok(("Across Protocol".to_string(), true))
    }

    fn get_route(
        &self,
        _from_chain: U256,
        _to_chain: U256,
        token: Address,
        amount: U256,
    ) -> Result<BridgeRoute, Vec<u8>> {
        ensure!(
            self.supported_tokens.get(&token).unwrap_or(&false),
            "Token not supported"
        );

        let min_amount = self.min_amounts.get(&token).unwrap_or(&U256::ZERO);
        ensure!(amount >= *min_amount, "Amount below minimum");

        // Across fees: relayer fee (0.15%)
        let relayer_fee = self.calculate_relayer_fee(amount);

        Ok(BridgeRoute {
            bridge_name: "Across Protocol".to_string(),
            estimated_time: U256::from(180), // ~3 minutes (fastest)
            estimated_gas: U256::from(120_000), // Most efficient
            fee: relayer_fee,
            available: true,
        })
    }

    fn bridge_tokens(
        &mut self,
        to_chain: U256,
        token: Address,
        amount: U256,
        recipient: Address,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        ensure!(
            self.supported_tokens.get(&token).unwrap_or(&false),
            "Token not supported"
        );
        ensure!(self.spoke_pool != Address::ZERO, "Spoke pool not set");

        let relayer_fee_pct = self.relayer_fee_bps;
        
        // Use current block timestamp as quote timestamp
        let quote_timestamp = U256::from(evm::block_timestamp());

        // Create spoke pool instance
        let spoke_pool = ISpokePool::new(self.spoke_pool);

        // Approve token spend if needed (would need ERC20 interface)

        // Execute the deposit (bridge transfer) - simplified for now
        // In production, would call spoke_pool.deposit with proper parameters

        Ok(())
    }
}

// Public external interface for router integration
#[public]
impl AcrossBridgeAdapter {
    pub fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>> {
        <Self as IBridgeAdapter>::get_bridge_info(self)
    }

    pub fn get_route(
        &self,
        from_chain: U256,
        to_chain: U256,
        token: Address,
        amount: U256,
    ) -> Result<(String, U256, U256, U256, bool), Vec<u8>> {
        let r = <Self as IBridgeAdapter>::get_route(self, from_chain, to_chain, token, amount)?;
        Ok((r.bridge_name, r.estimated_time, r.estimated_gas, r.fee, r.available))
    }

    pub fn bridge_tokens(
        &mut self,
        to_chain: U256,
        token: Address,
        amount: U256,
        recipient: Address,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        let _ = data; // unused
        <Self as IBridgeAdapter>::bridge_tokens(self, to_chain, token, amount, recipient, Vec::new())
    }
}
