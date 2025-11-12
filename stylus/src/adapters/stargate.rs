use alloy_primitives::{Address, U256};
use stylus_sdk::{prelude::*, storage::StorageMap};

use crate::adapters::{BridgeRoute, IBridgeAdapter};

/// Stargate Router Interface
#[sol_interface(name = "IStargateRouter")]
pub trait IStargateRouter {
    fn swap(
        &self,
        dst_chain_id: U256,
        src_pool_id: U256,
        dst_pool_id: U256,
        refund_address: Address,
        amount_in: U256,
        min_amount_out: U256,
        to: Address,
        payload: Vec<u8>
    );
}

#[storage]
pub struct StargateAdapter {
    owner: Address,
    router: Address,
    supported_tokens: StorageMap<Address, bool>,
    pool_ids: StorageMap<Address, U256>,
    min_amounts: StorageMap<Address, U256>,
}

impl StargateAdapter {
    pub fn new(router: Address) -> Self {
        let mut instance = Self::default();
        instance.owner = msg::sender();
        instance.router = router;
        instance
    }

    pub fn add_supported_token(&mut self, token: Address, pool_id: U256, min_amount: U256) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(token != Address::ZERO, "Invalid token");
        
        self.supported_tokens.insert(token, true);
        self.pool_ids.insert(token, pool_id);
        self.min_amounts.insert(token, min_amount);
        Ok(())
    }

    fn get_pool_id(&self, token: Address) -> Result<U256, Vec<u8>> {
        self.pool_ids
            .get(&token)
            .copied()
            .ok_or_else(|| "Pool ID not set".as_bytes().to_vec())
    }
}

impl IBridgeAdapter for StargateAdapter {
    fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>> {
        Ok(("Stargate".to_string(), true))
    }

    fn get_route(
        &self,
        _from_chain: U256,
        to_chain: U256,
        token: Address,
        amount: U256,
    ) -> Result<BridgeRoute, Vec<u8>> {
        ensure!(
            self.supported_tokens.get(&token).unwrap_or(&false),
            "Token not supported"
        );

        let min_amount = self.min_amounts.get(&token).unwrap_or(&U256::ZERO);
        ensure!(amount >= *min_amount, "Amount below minimum");

        // Stargate fees are typically around 0.06%
        let fee = amount.saturating_mul(U256::from(6)).saturating_div(U256::from(10000));

        Ok(BridgeRoute {
            bridge_name: "Stargate".to_string(),
            estimated_time: U256::from(900), // ~15 minutes
            estimated_gas: U256::from(250_000), // Conservative estimate
            fee,
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
        
        let pool_id = self.get_pool_id(token)?;
        let min_amount_out = amount.saturating_mul(U256::from(995)).saturating_div(U256::from(1000)); // 0.5% slippage

        // Create Stargate router instance
        let router = IStargateRouter::new(self.router);

        // Approve token spend if needed (would need ERC20 interface)

        // Execute the swap
        router.swap(
            to_chain,
            pool_id,
            pool_id,
            msg::sender(), // refund address
            amount,
            min_amount_out,
            recipient,
            vec![], // No extra payload
        );

        Ok(())
    }
}