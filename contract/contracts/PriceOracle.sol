// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title PriceOracle
 * @notice Oracle contract using Chainlink price feeds for token and gas prices
 */
contract PriceOracle is IPriceOracle, Ownable {
    // Mapping of token address to Chainlink price feed
    mapping(address => AggregatorV3Interface) public tokenPriceFeeds;
    
    // Mapping of chain ID to native token price feed
    mapping(uint256 => AggregatorV3Interface) public nativePriceFeeds;
    
    // Mapping of chain ID to gas price (manually set for testnets)
    mapping(uint256 => uint256) public gasPrices;

    event TokenPriceFeedSet(address indexed token, address indexed priceFeed);
    event NativePriceFeedSet(uint256 indexed chainId, address indexed priceFeed);
    event GasPriceSet(uint256 indexed chainId, uint256 gasPrice);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Set price feed for a token
     * @param token Token address
     * @param priceFeed Chainlink price feed address
     */
    function setTokenPriceFeed(address token, address priceFeed) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(priceFeed != address(0), "Invalid price feed");
        tokenPriceFeeds[token] = AggregatorV3Interface(priceFeed);
        emit TokenPriceFeedSet(token, priceFeed);
    }

    /**
     * @notice Set native token price feed for a chain
     * @param chainId Chain ID
     * @param priceFeed Chainlink price feed address
     */
    function setNativePriceFeed(uint256 chainId, address priceFeed) external onlyOwner {
        require(chainId > 0, "Invalid chain ID");
        require(priceFeed != address(0), "Invalid price feed");
        nativePriceFeeds[chainId] = AggregatorV3Interface(priceFeed);
        emit NativePriceFeedSet(chainId, priceFeed);
    }

    /**
     * @notice Set gas price for a chain (for testnets without gas oracle)
     * @param chainId Chain ID
     * @param gasPrice Gas price in wei
     */
    function setGasPrice(uint256 chainId, uint256 gasPrice) external onlyOwner {
        require(chainId > 0, "Invalid chain ID");
        require(gasPrice > 0, "Invalid gas price");
        gasPrices[chainId] = gasPrice;
        emit GasPriceSet(chainId, gasPrice);
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getTokenPrice(address token) external view override returns (uint256 price) {
        AggregatorV3Interface priceFeed = tokenPriceFeeds[token];
        require(address(priceFeed) != address(0), "Price feed not set");

        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        ) {
            require(answer > 0, "Invalid price");
            return uint256(answer);
        } catch {
            revert("Failed to get price");
        }
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getGasPrice(uint256 chainId) external view override returns (uint256 gasPrice) {
        gasPrice = gasPrices[chainId];
        require(gasPrice > 0, "Gas price not set");
        return gasPrice;
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function getNativeTokenPrice(uint256 chainId) external view override returns (uint256 price) {
        AggregatorV3Interface priceFeed = nativePriceFeeds[chainId];
        require(address(priceFeed) != address(0), "Price feed not set");

        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        ) {
            require(answer > 0, "Invalid price");
            return uint256(answer);
        } catch {
            revert("Failed to get price");
        }
    }

    /**
     * @inheritdoc IPriceOracle
     */
    function calculateGasCost(
        uint256 chainId,
        uint256 gasAmount
    ) external view override returns (uint256 cost) {
        uint256 gasPrice = gasPrices[chainId];
        require(gasPrice > 0, "Gas price not set");

        AggregatorV3Interface priceFeed = nativePriceFeeds[chainId];
        require(address(priceFeed) != address(0), "Price feed not set");

        try priceFeed.latestRoundData() returns (
            uint80,
            int256 answer,
            uint256,
            uint256,
            uint80
        ) {
            require(answer > 0, "Invalid price");
            // gasAmount * gasPrice * nativeTokenPrice / 1e18 (to get USD value)
            return (gasAmount * gasPrice * uint256(answer)) / 1e18;
        } catch {
            revert("Failed to calculate gas cost");
        }
    }
}



