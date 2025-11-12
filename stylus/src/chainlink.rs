use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

/// Chainlink Price Feed ABI interface
#[sol_interface(name = "IChainlinkAggregator")]
pub trait IChainlinkAggregator {
    /// Get the latest round data
    fn latest_round_data(&self) -> (U256, U256, U256, U256, U256);
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
        let aggregator = IChainlinkAggregator::new(self.address);
        
        let (_, price, _, timestamp, _) = aggregator.latestRoundData();
        
        // Ensure the price is fresh (within last hour)
        let current_time = eth::block_timestamp();
        ensure!(
            current_time - timestamp <= 3600,
            "Stale price feed"
        );

        Ok(price)
    }
}