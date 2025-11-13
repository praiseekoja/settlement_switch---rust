mod stargate;
mod mock;
mod hop;
mod across;

pub use stargate::StargateAdapter;
pub use mock::MockBridgeAdapter;
pub use hop::HopBridgeAdapter;
pub use across::AcrossBridgeAdapter;

use alloy_primitives::{Address, U256};
use alloc::{string::String, vec::Vec};

/// Bridge Route information
#[derive(Debug)]
pub struct BridgeRoute {
    pub bridge_name: String,
    pub estimated_time: U256,
    pub estimated_gas: U256,
    pub fee: U256,
    pub available: bool,
}

/// Bridge Adapter trait defining the interface for cross-chain bridges
pub trait IBridgeAdapter {
    /// Get information about this bridge adapter
    fn get_bridge_info(&self) -> Result<(String, bool), Vec<u8>>;

    /// Get route information for a cross-chain transfer
    fn get_route(
        &self,
        from_chain: U256,
        to_chain: U256,
        token: Address,
        amount: U256,
    ) -> Result<BridgeRoute, Vec<u8>>;

    /// Execute a cross-chain transfer
    fn bridge_tokens(
        &mut self,
        to_chain: U256,
        token: Address,
        amount: U256,
        recipient: Address,
        data: Vec<u8>,
    ) -> Result<(), Vec<u8>>;
}