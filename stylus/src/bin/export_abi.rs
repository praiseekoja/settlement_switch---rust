#![cfg(feature = "export-abi")]

use settlement_switch::SettlementSwitch;
use stylus_sdk::abi::export::print_from_args;

fn main() {
    print_from_args::<SettlementSwitch>();
}

