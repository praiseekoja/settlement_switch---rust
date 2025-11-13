mod price_oracle;

pub use price_oracle::PriceOracle;

use alloy_primitives::{Address, U256};
use alloc::vec::Vec;

/// Price Oracle trait defining the interface for price queries
pub trait IPriceOracle {
    /// Get the price of a token in USD (8 decimals)
    fn get_token_price(&self, token: Address) -> Result<U256, Vec<u8>>;

    /// Get the gas price for a chain
    fn get_gas_price(&self, chain_id: U256) -> Result<U256, Vec<u8>>;

    /// Get the price of the native token for a chain in USD (8 decimals)
    fn get_native_token_price(&self, chain_id: U256) -> Result<U256, Vec<u8>>;

    /// Calculate gas cost in USD (8 decimals)
    fn calculate_gas_cost(&self, chain_id: U256, gas_amount: U256) -> Result<U256, Vec<u8>>;
}