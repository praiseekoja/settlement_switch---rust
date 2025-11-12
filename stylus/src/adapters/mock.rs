use alloy_primitives::{Address, U256};
use stylus_sdk::{prelude::*, storage::StorageMap};

use super::{BridgeRoute, IBridgeAdapter};

#[storage]
pub struct MockBridgeAdapter {
    owner: Address,
    supported_tokens: StorageMap<Address, bool>,
}

impl MockBridgeAdapter {
    pub fn new() -> Self {
        let mut instance = Self::default();
        instance.owner = msg::sender();
        instance
    }

    pub fn add_supported_token(&mut self, token: Address) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        ensure!(token != Address::ZERO, "Invalid token");
        
        self.supported_tokens.insert(token, true);
        Ok(())
    }
}

impl IBridgeAdapter for MockBridgeAdapter {
    fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>> {
        Ok(("Mock Bridge".to_string(), true))
    }

    fn get_route(
        &self,
        _from_chain: U256,
        _to_chain: U256,
        token: Address,
        _amount: U256,
    ) -> Result<BridgeRoute, Vec<u8>> {
        ensure!(
            self.supported_tokens.get(&token).unwrap_or(&false),
            "Token not supported"
        );

        Ok(BridgeRoute {
            bridge_name: "Mock Bridge".to_string(),
            estimated_time: U256::from(300), // 5 minutes
            estimated_gas: U256::from(100_000),
            fee: U256::from(1_000_000), // 0.001 tokens
            available: true,
        })
    }

    fn bridge_tokens(
        &mut self,
        _to_chain: U256,
        token: Address,
        amount: U256,
        recipient: Address,
        _data: Vec<u8>,
    ) -> Result<(), Vec<u8>> {
        ensure!(
            self.supported_tokens.get(&token).unwrap_or(&false),
            "Token not supported"
        );
        ensure!(amount > U256::ZERO, "Invalid amount");
        ensure!(recipient != Address::ZERO, "Invalid recipient");

        // In a real implementation, this would handle the actual token transfer
        // and bridge interaction
        Ok(())
    }
}