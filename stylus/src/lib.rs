//!
//! Settlement Switch Contract
//!
//! A Stylus smart contract for settlement switching.
//!
//! Note: this code is a template-only and has not been audited.
//!
// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::vec::Vec;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{alloy_primitives::U256, prelude::*};

// Define some persistent storage using the Solidity ABI.
// `SettlementSwitch` will be the entrypoint.
sol_storage! {
    #[entrypoint]
    pub struct SettlementSwitch {
        uint256 counter;
    }
}

/// Declare that `SettlementSwitch` is a contract with the following external methods.
#[public]
impl SettlementSwitch {
    /// Gets the counter from storage.
    pub fn get_counter(&self) -> U256 {
        self.counter.get()
    }

    /// Sets the counter in storage to a user-specified value.
    pub fn set_counter(&mut self, new_value: U256) {
        self.counter.set(new_value);
    }

    /// Increments the counter.
    pub fn increment(&mut self) {
        let counter = self.counter.get();
        self.counter.set(counter + U256::from(1));
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn test_settlement_switch() {
        use stylus_sdk::testing::*;
        let vm = TestVM::default();
        let mut contract = SettlementSwitch::from(&vm);

        assert_eq!(U256::ZERO, contract.get_counter());

        contract.increment();
        assert_eq!(U256::from(1), contract.get_counter());

        contract.set_counter(U256::from(100));
        assert_eq!(U256::from(100), contract.get_counter());
    }
}
