// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../adapters/MockBridgeAdapter.sol";

/**
 * @title HopBridgeAdapter
 * @notice Mock Hop Protocol bridge adapter
 * @dev Simulates Hop Protocol's bridging mechanism
 */
contract HopBridgeAdapter is MockBridgeAdapter {
    constructor() 
        MockBridgeAdapter(
            "Hop Protocol",
            150000,  // Base gas estimate: 150k gas
            10,      // 0.1% fee
            300      // Estimated time: 5 minutes
        ) 
    {}
}



