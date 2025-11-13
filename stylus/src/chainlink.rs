use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

/// Chainlink Price Feed ABI interface
sol_interface! {
    interface IChainlinkAggregator {
        function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
    }
}

/// Helper struct for interacting with Chainlink price feeds
pub struct ChainlinkPriceFeed {
    address: Address,
}

impl ChainlinkPriceFeed {
    pub fn new(address: Address) -> Self {
        Self { address }
    }

    /// Get the latest price from the feed
    pub fn get_price(&self) -> Result<U256, Vec<u8>> {
        // In production, would call Chainlink aggregator
        // For now, return mock price
        Ok(U256::from(100_000_000)) // $1.00 with 8 decimals
    }
}