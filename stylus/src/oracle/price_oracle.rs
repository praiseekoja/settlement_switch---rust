use alloy_primitives::{Address, U256};
use stylus_sdk::{
    alloc::vec::Vec,
    evm,
    msg,
    prelude::*,
    storage::StorageMap,
};
use crate::chainlink::ChainlinkPriceFeed;

#[sol_event]
pub struct TokenPriceFeedSet {
    pub token: Address,
    pub price_feed: Address,
}

#[sol_event]
pub struct NativePriceFeedSet {
    pub chain_id: U256,
    pub price_feed: Address,
}

#[sol_event]
pub struct GasPriceSet {
    pub chain_id: U256,
    pub gas_price: U256,
}

#[storage]
pub struct PriceOracle {
    // Token price feeds mapping: token address => price feed address
    token_price_feeds: StorageMap<Address, Address>,
    
    // Native token price feeds mapping: chain_id => price feed address
    native_price_feeds: StorageMap<U256, Address>,
    
    // Gas prices mapping: chain_id => gas price
    gas_prices: StorageMap<U256, U256>,
    
    // Owner address
    owner: Address,
}

impl PriceOracle {
    pub fn new() -> Self {
        let mut instance = Self::default();
        instance.owner = msg::sender();
        instance
    }

    pub fn set_token_price_feed(&mut self, token: Address, price_feed: Address) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(token != Address::ZERO, "Invalid token address");
        ensure!(price_feed != Address::ZERO, "Invalid price feed");
        
        self.token_price_feeds.insert(token, price_feed);
        
        // Emit event
        evm::log(TokenPriceFeedSet { token, price_feed });
        Ok(())
    }

    pub fn set_native_price_feed(&mut self, chain_id: U256, price_feed: Address) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(!chain_id.is_zero(), "Invalid chain ID");
        ensure!(price_feed != Address::ZERO, "Invalid price feed");
        
        self.native_price_feeds.insert(chain_id, price_feed);
        
        // Emit event
        evm::log(NativePriceFeedSet { chain_id, price_feed });
        Ok(())
    }

    pub fn set_gas_price(&mut self, chain_id: U256, gas_price: U256) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(!chain_id.is_zero(), "Invalid chain ID");
        ensure!(!gas_price.is_zero(), "Invalid gas price");
        
        self.gas_prices.insert(chain_id, gas_price);
        
        // Emit event
        evm::log(GasPriceSet { chain_id, gas_price });
        Ok(())
    }

    fn ensure_owner(&self) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        Ok(())
    }

    fn get_price_feed(&self, token: Address) -> Result<ChainlinkPriceFeed, Vec<u8>> {
        let feed_address = self.token_price_feeds
            .get(&token)
            .copied()
            .ok_or_else(|| "Price feed not set".as_bytes().to_vec())?;
            
        Ok(ChainlinkPriceFeed::new(feed_address))
    }

    fn get_native_price_feed(&self, chain_id: U256) -> Result<ChainlinkPriceFeed, Vec<u8>> {
        let feed_address = self.native_price_feeds
            .get(&chain_id)
            .copied()
            .ok_or_else(|| "Price feed not set".as_bytes().to_vec())?;
            
        Ok(ChainlinkPriceFeed::new(feed_address))
    }
}

impl super::IPriceOracle for PriceOracle {
    fn get_token_price(&self, token: Address) -> Result<U256, Vec<u8>> {
        let price_feed = self.get_price_feed(token)?;
        price_feed.get_price()
    }

    fn get_gas_price(&self, chain_id: U256) -> Result<U256, Vec<u8>> {
        self.gas_prices
            .get(&chain_id)
            .ok_or_else(|| "Gas price not set".as_bytes().to_vec())
            .copied()
    }

    fn get_native_token_price(&self, chain_id: U256) -> Result<U256, Vec<u8>> {
        let price_feed = self.get_native_price_feed(chain_id)?;
        price_feed.get_price()
    }

    fn calculate_gas_cost(&self, chain_id: U256, gas_amount: U256) -> Result<U256, Vec<u8>> {
        let gas_price = self.get_gas_price(chain_id)?;
        let native_price = self.get_native_token_price(chain_id)?;
        
        // Calculate: gasAmount * gasPrice * nativeTokenPrice / 1e18
        Ok(gas_amount
            .saturating_mul(gas_price)
            .saturating_mul(native_price)
            .saturating_div(U256::from(10).pow(U256::from(18))))
    }
}