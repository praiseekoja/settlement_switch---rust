// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IBridgeAdapter.sol";

/**
 * @title MockBridgeAdapter
 * @notice Mock bridge adapter for testing cross-chain transfers on testnets
 * @dev This simulates a bridge by locking tokens and emitting events
 */
contract MockBridgeAdapter is IBridgeAdapter, Ownable {
    using SafeERC20 for IERC20;

    string public bridgeName;
    uint256 public baseGasEstimate;
    uint256 public baseFeePercent; // In basis points (100 = 1%)
    uint256 public estimatedTimeSeconds;

    // Supported tokens per chain
    mapping(uint256 => mapping(address => bool)) public supportedTokens;

    // Bridge statistics
    mapping(uint256 => uint256) public totalBridged;
    mapping(address => uint256) public userBridged;

    event BridgeInitiated(
        address indexed sender,
        address indexed token,
        uint256 amount,
        uint256 fromChain,
        uint256 toChain,
        address recipient,
        uint256 timestamp
    );

    event TokenSupportUpdated(uint256 chainId, address token, bool supported);

    constructor(
        string memory _bridgeName,
        uint256 _baseGasEstimate,
        uint256 _baseFeePercent,
        uint256 _estimatedTimeSeconds
    ) Ownable(msg.sender) {
        bridgeName = _bridgeName;
        baseGasEstimate = _baseGasEstimate;
        baseFeePercent = _baseFeePercent;
        estimatedTimeSeconds = _estimatedTimeSeconds;
    }

    /**
     * @notice Set token support for a specific chain
     * @param chainId Chain ID
     * @param token Token address
     * @param supported Whether the token is supported
     */
    function setTokenSupport(
        uint256 chainId,
        address token,
        bool supported
    ) external onlyOwner {
        supportedTokens[chainId][token] = supported;
        emit TokenSupportUpdated(chainId, token, supported);
    }

    /**
     * @notice Update bridge parameters
     */
    function updateParameters(
        uint256 _baseGasEstimate,
        uint256 _baseFeePercent,
        uint256 _estimatedTimeSeconds
    ) external onlyOwner {
        baseGasEstimate = _baseGasEstimate;
        baseFeePercent = _baseFeePercent;
        estimatedTimeSeconds = _estimatedTimeSeconds;
    }

    /**
     * @inheritdoc IBridgeAdapter
     */
    function getBridgeInfo() external view override returns (string memory name, bool supported) {
        return (bridgeName, true);
    }

    /**
     * @inheritdoc IBridgeAdapter
     */
    function getRoute(
        uint256 fromChain,
        uint256 toChain,
        address token,
        uint256 amount
    ) external view override returns (BridgeRoute memory route) {
        bool isSupported = supportedTokens[fromChain][token] && supportedTokens[toChain][token];
        
        uint256 fee = (amount * baseFeePercent) / 10000;
        
        return BridgeRoute({
            bridgeName: bridgeName,
            estimatedTime: estimatedTimeSeconds,
            estimatedGas: baseGasEstimate,
            fee: fee,
            available: isSupported
        });
    }

    /**
     * @inheritdoc IBridgeAdapter
     */
    function bridge(
        uint256 toChain,
        address token,
        uint256 amount,
        address recipient
    ) external payable override returns (bool success) {
        uint256 fromChain = block.chainid;
        
        require(
            supportedTokens[fromChain][token] && supportedTokens[toChain][token],
            "Token not supported"
        );
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient");

        // Transfer tokens from sender to this contract (simulating locking)
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Update statistics
        totalBridged[toChain] += amount;
        userBridged[msg.sender] += amount;

        // Emit bridge event
        emit BridgeInitiated(
            msg.sender,
            token,
            amount,
            fromChain,
            toChain,
            recipient,
            block.timestamp
        );

        return true;
    }

    /**
     * @inheritdoc IBridgeAdapter
     */
    function isTokenSupported(
        address token,
        uint256 fromChain,
        uint256 toChain
    ) external view override returns (bool supported) {
        return supportedTokens[fromChain][token] && supportedTokens[toChain][token];
    }

    /**
     * @notice Emergency withdraw function (only for testing)
     * @param token Token to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }
}



