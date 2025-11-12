// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPriceOracle
 * @notice Interface for price oracle to get token prices and gas prices
 */
interface IPriceOracle {
    /**
     * @notice Get the USD price of a token
     * @param token Token address
     * @return price Price in USD (8 decimals)
     */
    function getTokenPrice(address token) external view returns (uint256 price);

    /**
     * @notice Get the gas price for a specific chain
     * @param chainId Chain ID
     * @return gasPrice Gas price in wei
     */
    function getGasPrice(uint256 chainId) external view returns (uint256 gasPrice);

    /**
     * @notice Get the native token price in USD for a chain
     * @param chainId Chain ID
     * @return price Price in USD (8 decimals)
     */
    function getNativeTokenPrice(uint256 chainId) external view returns (uint256 price);

    /**
     * @notice Calculate the USD cost of gas for a transaction
     * @param chainId Chain ID
     * @param gasAmount Gas amount
     * @return cost Cost in USD (8 decimals)
     */
    function calculateGasCost(
        uint256 chainId,
        uint256 gasAmount
    ) external view returns (uint256 cost);
}



