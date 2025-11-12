use alloy_primitives::{Address, U256};
use stylus_sdk::{prelude::*, storage::StorageMap};

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

/// Price Oracle trait defining the interface for price and gas calculations
pub trait IPriceOracle {
    /// Get the USD price of a token
    /// Returns price in USD (8 decimals)
    fn get_token_price(&self, token: Address) -> Result<U256, Vec<u8>>;

    /// Get the gas price for a specific chain
    /// Returns gas price in wei
    fn get_gas_price(&self, chain_id: U256) -> Result<U256, Vec<u8>>;

    /// Get the native token price in USD for a chain
    /// Returns price in USD (8 decimals)
    fn get_native_token_price(&self, chain_id: U256) -> Result<U256, Vec<u8>>;

    /// Calculate the USD cost of gas for a transaction
    /// Returns cost in USD (8 decimals)
    fn calculate_gas_cost(&self, chain_id: U256, gas_amount: U256) -> Result<U256, Vec<u8>>;
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
        Ok(())
    }

    pub fn set_native_price_feed(&mut self, chain_id: U256, price_feed: Address) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(!chain_id.is_zero(), "Invalid chain ID");
        ensure!(price_feed != Address::ZERO, "Invalid price feed");
        
        self.native_price_feeds.insert(chain_id, price_feed);
        Ok(())
    }

    pub fn set_gas_price(&mut self, chain_id: U256, gas_price: U256) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(!chain_id.is_zero(), "Invalid chain ID");
        ensure!(!gas_price.is_zero(), "Invalid gas price");
        
        self.gas_prices.insert(chain_id, gas_price);
        Ok(())
    }

    fn ensure_owner(&self) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        Ok(())
    }
}

impl IPriceOracle for PriceOracle {
    fn get_token_price(&self, token: Address) -> Result<U256, Vec<u8>> {
        let price_feed = self.token_price_feeds
            .get(&token)
            .ok_or_else(|| "Price feed not set".as_bytes().to_vec())?;
            
        // Here we would integrate with Chainlink price feeds
        // For now returning a placeholder
        Ok(U256::from(1_000_000_000)) // $1.00 with 8 decimals
    }

    fn get_gas_price(&self, chain_id: U256) -> Result<U256, Vec<u8>> {
        self.gas_prices
            .get(&chain_id)
            .ok_or_else(|| "Gas price not set".as_bytes().to_vec())
            .copied()
    }

    fn get_native_token_price(&self, chain_id: U256) -> Result<U256, Vec<u8>> {
        let price_feed = self.native_price_feeds
            .get(&chain_id)
            .ok_or_else(|| "Price feed not set".as_bytes().to_vec())?;
            
        // Here we would integrate with Chainlink price feeds
        // For now returning a placeholder
        Ok(U256::from(2_000_000_000)) // $2.00 with 8 decimals
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