// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeAdapter
 * @notice Interface for bridge adapters that facilitate cross-chain transfers
 */
interface IBridgeAdapter {
    /**
     * @notice Information about a bridge route
     * @param bridgeName Name of the bridge protocol
     * @param estimatedTime Estimated time in seconds
     * @param estimatedGas Estimated gas cost in wei
     * @param fee Bridge fee in token amount
     * @param available Whether the bridge is currently available
     */
    struct BridgeRoute {
        string bridgeName;
        uint256 estimatedTime;
        uint256 estimatedGas;
        uint256 fee;
        bool available;
    }

    /**
     * @notice Get information about this bridge adapter
     * @return name Bridge name
     * @return supported Whether bridge is supported
     */
    function getBridgeInfo() external view returns (string memory name, bool supported);

    /**
     * @notice Get route information for a cross-chain transfer
     * @param fromChain Source chain ID
     * @param toChain Destination chain ID
     * @param token Token address
     * @param amount Amount to bridge
     * @return route Bridge route information
     */
    function getRoute(
        uint256 fromChain,
        uint256 toChain,
        address token,
        uint256 amount
    ) external view returns (BridgeRoute memory route);

    /**
     * @notice Execute a cross-chain transfer
     * @param toChain Destination chain ID
     * @param token Token address
     * @param amount Amount to bridge
     * @param recipient Recipient address on destination chain
     * @return success Whether the bridge was initiated successfully
     */
    function bridge(
        uint256 toChain,
        address token,
        uint256 amount,
        address recipient
    ) external payable returns (bool success);

    /**
     * @notice Check if a token is supported for bridging
     * @param token Token address
     * @param fromChain Source chain ID
     * @param toChain Destination chain ID
     * @return supported Whether the token is supported
     */
    function isTokenSupported(
        address token,
        uint256 fromChain,
        uint256 toChain
    ) external view returns (bool supported);
}



