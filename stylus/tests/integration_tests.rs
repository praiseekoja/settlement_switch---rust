use alloy_primitives::{Address, U256};
use stylus_sdk::prelude::*;

use crate::{
    IPriceOracle,
    PriceOracle,
    StablecoinRouter,
    TransferRequest,
    MockBridgeAdapter,
};

#[test]
fn test_price_oracle() {
    let oracle = PriceOracle::new();
    let token = Address::random();
    let price_feed = Address::random();
    
    // Test setting price feed
    oracle.set_token_price_feed(token, price_feed).unwrap();
    
    // Test setting gas price
    let chain_id = U256::from(1);
    let gas_price = U256::from(50_000_000_000); // 50 gwei
    oracle.set_gas_price(chain_id, gas_price).unwrap();
    
    // Test getting gas price
    assert_eq!(oracle.get_gas_price(chain_id).unwrap(), gas_price);
}

#[test]
fn test_mock_bridge() {
    let adapter = MockBridgeAdapter::new();
    let token = Address::random();
    
    // Add supported token
    adapter.add_supported_token(token).unwrap();
    
    // Test route retrieval
    let route = adapter.get_route(
        U256::from(1), // from chain
        U256::from(2), // to chain
        token,
        U256::from(1000000), // 1 USDC (6 decimals)
    ).unwrap();
    
    assert_eq!(route.bridge_name, "Mock Bridge");
    assert!(route.available);
}

#[test]
fn test_router_integration() {
    let oracle = PriceOracle::new();
    let router = StablecoinRouter::new(oracle.address()).unwrap();
    let adapter = MockBridgeAdapter::new();
    
    // Add bridge adapter
    router.add_bridge_adapter(adapter.address()).unwrap();
    
    // Create transfer request
    let request = TransferRequest {
        from_chain: U256::from(1),
        to_chain: U256::from(2),
        token: Address::random(),
        amount: U256::from(1000000),
        recipient: Address::random(),
    };
    
    // Test route finding
    let route = router.find_best_route(request.clone()).unwrap();
    assert!(route.available);
    assert_eq!(route.bridge_adapter, adapter.address());
}

// Test helper functions
fn create_test_env() -> (PriceOracle, StablecoinRouter, MockBridgeAdapter) {
    let oracle = PriceOracle::new();
    let router = StablecoinRouter::new(oracle.address()).unwrap();
    let adapter = MockBridgeAdapter::new();
    
    (oracle, router, adapter)
}