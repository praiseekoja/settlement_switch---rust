// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../adapters/MockBridgeAdapter.sol";

/**
 * @title StargateAdapter
 * @notice Mock Stargate Finance bridge adapter
 * @dev Simulates Stargate's LayerZero-based bridging
 */
contract StargateAdapter is MockBridgeAdapter {
    constructor() 
        MockBridgeAdapter(
            "Stargate Finance",
            180000,  // Base gas estimate: 180k gas
            5,       // 0.05% fee (cheaper fees)
            600      // Estimated time: 10 minutes
        ) 
    {}
}



