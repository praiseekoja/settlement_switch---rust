use alloy_primitives::{Address, U256};
use stylus_sdk::{
    alloc::{string::String, vec, vec::Vec},
    msg,
    prelude::*,
    storage::{StorageMap, StorageVec},
};

use crate::adapters::{BridgeRoute, IBridgeAdapter};
use crate::oracle::IPriceOracle;

#[derive(Debug)]
pub struct RouteInfo {
    pub bridge_adapter: Address,
    pub bridge_name: String,
    pub estimated_time: U256,
    pub estimated_gas_cost: U256, // In USD (8 decimals)
    pub bridge_fee: U256,         // In token amount
    pub total_cost_usd: U256,     // Total cost in USD (8 decimals)
    pub amount_out: U256,         // Amount after fees
    pub available: bool,
}

#[derive(Debug)]
pub struct TransferRequest {
    pub from_chain: U256,
    pub to_chain: U256,
    pub token: Address,
    pub amount: U256,
    pub recipient: Address,
}

#[storage]
pub struct StablecoinRouter {
    // Price oracle for gas and token prices
    price_oracle: Address,

    // Bridge adapters
    bridge_adapters: StorageVec<Address>,
    is_bridge_adapter: StorageMap<Address, bool>,

    // Supported tokens
    supported_tokens: StorageMap<Address, bool>,
    token_list: StorageVec<Address>,

    // Route finding parameters
    max_routes: U256,

    // Statistics
    total_transfers: U256,
    total_volume_usd: U256,

    // Owner
    owner: Address,
}

impl StablecoinRouter {
    pub fn new(price_oracle: Address) -> Result<Self, Vec<u8>> {
        ensure!(price_oracle != Address::ZERO, "Invalid oracle address");

        let mut instance = Self::default();
        instance.price_oracle = price_oracle;
        instance.owner = msg::sender();
        instance.max_routes = U256::from(5);
        
        Ok(instance)
    }

    pub fn add_bridge_adapter(&mut self, adapter: Address) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(adapter != Address::ZERO, "Invalid adapter address");
        ensure!(!self.is_bridge_adapter.get(&adapter).unwrap_or(&false), "Adapter exists");

        // Verify the adapter implements IBridgeAdapter
        let bridge = self.get_bridge_adapter(adapter)?;
        let (name, supported) = bridge.get_bridge_info()?;
        ensure!(supported, "Bridge not supported");

        self.bridge_adapters.push(adapter);
        self.is_bridge_adapter.insert(adapter, true);

        // Emit event would go here
        Ok(())
    }

    pub fn remove_bridge_adapter(&mut self, adapter: Address) -> Result<(), Vec<u8>> {
        self.ensure_owner()?;
        ensure!(self.is_bridge_adapter.get(&adapter).unwrap_or(&false), "Adapter not found");

        // Remove from is_bridge_adapter mapping
        self.is_bridge_adapter.insert(adapter, false);

        // Remove from bridge_adapters vec (this is inefficient, but matches Solidity behavior)
        let mut new_adapters = Vec::new();
        for i in 0..self.bridge_adapters.len() {
            let current = self.bridge_adapters.get(i).unwrap();
            if current != adapter {
                new_adapters.push(current);
            }
        }

        // Clear and repopulate bridge_adapters
        while self.bridge_adapters.pop().is_some() {}
        for adapter in new_adapters {
            self.bridge_adapters.push(adapter);
        }

        // Emit event would go here
        Ok(())
    }

    pub fn find_best_route(&self, request: TransferRequest) -> Result<RouteInfo, Vec<u8>> {
        ensure!(self.supported_tokens.get(&request.token).unwrap_or(&false), "Token not supported");
        
        let mut best_route: Option<RouteInfo> = None;
        let mut best_cost = U256::MAX;

        for i in 0..self.bridge_adapters.len() {
            let adapter_addr = self.bridge_adapters.get(i).unwrap();
            let adapter = self.get_bridge_adapter(adapter_addr)?;

            // Get route from adapter
            let route = match adapter.get_route(
                request.from_chain,
                request.to_chain,
                request.token,
                request.amount,
            ) {
                Ok(r) => r,
                Err(_) => continue, // Skip if route not available
            };

            if !route.available {
                continue;
            }

            // Calculate total cost
            let gas_cost = self.price_oracle().calculate_gas_cost(
                request.to_chain,
                route.estimated_gas,
            )?;

            let total_cost = gas_cost; // In a full implementation, would add bridge fee converted to USD

            if total_cost < best_cost {
                best_cost = total_cost;
                best_route = Some(RouteInfo {
                    bridge_adapter: adapter_addr,
                    bridge_name: route.bridge_name,
                    estimated_time: route.estimated_time,
                    estimated_gas_cost: gas_cost,
                    bridge_fee: route.fee,
                    total_cost_usd: total_cost,
                    amount_out: request.amount.saturating_sub(route.fee),
                    available: true,
                });
            }
        }

        best_route.ok_or_else(|| "No route available".as_bytes().to_vec())
    }

    pub fn execute_transfer(&mut self, request: TransferRequest) -> Result<(), Vec<u8>> {
        let route = self.find_best_route(request.clone())?;
        ensure!(route.available, "Route not available");

        let adapter = self.get_bridge_adapter(route.bridge_adapter)?;
        
        // Execute the bridge transaction
        adapter.bridge_tokens(
            request.to_chain,
            request.token,
            request.amount,
            request.recipient,
            vec![], // Additional data if needed
        )?;

        // Update statistics
        self.total_transfers += U256::from(1);
        self.total_volume_usd += self.price_oracle().get_token_price(request.token)?
            .saturating_mul(request.amount)
            .saturating_div(U256::from(10).pow(U256::from(18)));

        Ok(())
    }

    // Helper functions
    fn ensure_owner(&self) -> Result<(), Vec<u8>> {
        ensure!(msg::sender() == self.owner, "Not owner");
        Ok(())
    }

    fn get_bridge_adapter(&self, addr: Address) -> Result<&dyn IBridgeAdapter, Vec<u8>> {
        // In a real implementation, this would need to properly resolve the contract
        // and verify it implements IBridgeAdapter
        unimplemented!()
    }

    fn price_oracle(&self) -> &dyn IPriceOracle {
        // In a real implementation, this would need to properly resolve the contract
        unimplemented!()
    }
}