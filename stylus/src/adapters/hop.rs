use alloy_primitives::{Address, U256};
use alloc::{string::String, vec::Vec};
use stylus_sdk::{evm, msg, prelude::*, storage::StorageMap};

use crate::adapters::{BridgeRoute, IBridgeAdapter};

/// Hop Protocol Bridge Interface
sol_interface! {
    interface IHopBridge {
        function sendToL2(
            uint256 chainId,
            address recipient,
            uint256 amount,
            uint256 amountOutMin,
            uint256 deadline,
            address relayer,
            uint256 relayerFee
        ) external payable;
    }
}

/// Hop Protocol AMM Interface
sol_interface! {
    interface IHopAMM {
        function swapAndSend(
            uint256 chainId,
            address recipient,
            uint256 amount,
            uint256 bonderFee,
            uint256 amountOutMin,
            uint256 deadline,
            uint256 destinationAmountOutMin,
            uint256 destinationDeadline
        ) external payable;
    }
}

#[storage]
pub struct HopBridgeAdapter {
    owner: Address,
    // Hop bridge contract per token
    hop_bridges: StorageMap<Address, Address>,
    // Hop AMM contract per token
    hop_amms: StorageMap<Address, Address>,
    supported_tokens: StorageMap<Address, bool>,
    min_amounts: StorageMap<Address, U256>,
    // Bonder fee in basis points (e.g., 10 = 0.1%)
    bonder_fee_bps: U256,
}

impl HopBridgeAdapter {
    pub fn new() -> Self {
        let mut instance = Self::default();
        instance.owner = msg::sender();
        instance.bonder_fee_bps = U256::from(10); // 0.1% default
        instance
    }

    pub fn add_supported_token(
        &mut self,
        token: Address,
        hop_bridge: Address,
        hop_amm: Address,
        min_amount: U256,
    ) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(token != Address::ZERO, "Invalid token");
        ensure!(hop_bridge != Address::ZERO, "Invalid bridge");
        ensure!(hop_amm != Address::ZERO, "Invalid AMM");

        self.supported_tokens.insert(token, true);
        self.hop_bridges.insert(token, hop_bridge);
        self.hop_amms.insert(token, hop_amm);
        self.min_amounts.insert(token, min_amount);
        Ok(())
    }

    pub fn set_bonder_fee(&mut self, fee_bps: U256) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(fee_bps <= U256::from(1000), "Fee too high"); // Max 10%
        self.bonder_fee_bps = fee_bps;
        Ok(())
    }

    fn get_hop_bridge(&self, token: Address) -> Result<Address, Vec<u8>> {
        self.hop_bridges
            .get(&token)
            .copied()
            .ok_or_else(|| "Hop bridge not set".as_bytes().to_vec())
    }

    fn get_hop_amm(&self, token: Address) -> Result<Address, Vec<u8>> {
        self.hop_amms
            .get(&token)
            .copied()
            .ok_or_else(|| "Hop AMM not set".as_bytes().to_vec())
    }

    fn calculate_bonder_fee(&self, amount: U256) -> U256 {
        amount
            .saturating_mul(self.bonder_fee_bps)
            .saturating_div(U256::from(10000))
    }
}

impl IBridgeAdapter for HopBridgeAdapter {
    fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>> {
        Ok(("Hop Protocol".to_string(), true))
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

        // Hop fees: bonder fee (0.1%) + LP fee (0.04%)
        let bonder_fee = self.calculate_bonder_fee(amount);
        let lp_fee = amount.saturating_mul(U256::from(4)).saturating_div(U256::from(10000));
        let total_fee = bonder_fee.saturating_add(lp_fee);

        Ok(BridgeRoute {
            bridge_name: "Hop Protocol".to_string(),
            estimated_time: U256::from(300), // ~5 minutes
            estimated_gas: U256::from(150_000),
            fee: total_fee,
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

        let hop_bridge = self.get_hop_bridge(token)?;
        let bonder_fee = self.calculate_bonder_fee(amount);
        
        // Calculate minimum output (0.5% slippage tolerance)
        let amount_out_min = amount
            .saturating_mul(U256::from(995))
            .saturating_div(U256::from(1000));

        // Set deadline to 20 minutes from now
        let deadline = U256::from(evm::block_timestamp() + 1200);

        // Create Hop bridge instance
        let bridge = IHopBridge::new(hop_bridge);

        // Approve token spend if needed (would need ERC20 interface)

        // Execute the bridge transfer - simplified for now
        // In production, would call bridge.sendToL2 with proper parameters

        Ok(())
    }
}

// Public external interface for router integration
#[public]
impl HopBridgeAdapter {
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
