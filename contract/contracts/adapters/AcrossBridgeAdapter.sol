// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../adapters/MockBridgeAdapter.sol";

/**
 * @title AcrossBridgeAdapter
 * @notice Mock Across Protocol bridge adapter
 * @dev Simulates Across Protocol's bridging mechanism
 */
contract AcrossBridgeAdapter is MockBridgeAdapter {
    constructor() 
        MockBridgeAdapter(
            "Across Protocol",
            120000,  // Base gas estimate: 120k gas (more efficient)
            15,      // 0.15% fee
            180      // Estimated time: 3 minutes (faster)
        ) 
    {}
}



