use alloy_primitives::{Address, U256};
use stylus_sdk::{call::Call, prelude::*};

/// ERC20 Token Interface
sol_interface! {
    interface IERC20 {
        function totalSupply() external view returns (uint256);
        function balanceOf(address account) external view returns (uint256);
        function transfer(address recipient, uint256 amount) external returns (bool);
        function allowance(address owner, address spender) external view returns (uint256);
        function approve(address spender, uint256 amount) external returns (bool);
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    }
}

/// Helper functions for ERC20 operations
pub struct ERC20Helper;

impl ERC20Helper {
    /// Approve a spender to use tokens
    pub fn approve_token(
        token: Address,
        spender: Address,
        amount: U256,
    ) -> Result<(), Vec<u8>> {
        // In production, would call ERC20 approve
        // For now, assume approval succeeds
        Ok(())
    }

    /// Transfer tokens from sender to recipient
    pub fn transfer_from(
        token: Address,
        from: Address,
        to: Address,
        amount: U256,
    ) -> Result<(), Vec<u8>> {
        // In production, would call ERC20 transferFrom
        // For now, assume transfer succeeds
        Ok(())
    }

    /// Check token balance
    pub fn balance_of(token: Address, account: Address) -> U256 {
        // In production, would call ERC20 balanceOf
        // For now, return mock balance
        U256::from(1000000000000u64) // 1M tokens
    }

    /// Check allowance
    pub fn allowance(token: Address, owner: Address, spender: Address) -> U256 {
        // In production, would call ERC20 allowance
        // For now, return unlimited allowance
        U256::MAX
    }
}

