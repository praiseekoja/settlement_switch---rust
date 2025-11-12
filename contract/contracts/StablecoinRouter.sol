// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IBridgeAdapter.sol";
import "./interfaces/IPriceOracle.sol";

/**
 * @title StablecoinRouter
 * @notice Main router contract that finds the optimal path for cross-chain stablecoin transfers
 * @dev Supports multiple bridge adapters and uses price oracle for cost calculation
 */
contract StablecoinRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Price oracle for gas and token prices
    IPriceOracle public priceOracle;

    // List of available bridge adapters
    address[] public bridgeAdapters;
    
    // Mapping to check if an address is a registered bridge
    mapping(address => bool) public isBridgeAdapter;

    // Supported stablecoins
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;

    // Route finding parameters
    uint256 public maxRoutes = 5; // Maximum number of routes to compare

    // Statistics
    uint256 public totalTransfers;
    uint256 public totalVolumeUSD;

    struct RouteInfo {
        address bridgeAdapter;
        string bridgeName;
        uint256 estimatedTime;
        uint256 estimatedGasCost; // In USD (8 decimals)
        uint256 bridgeFee; // In token amount
        uint256 totalCostUSD; // Total cost in USD (8 decimals)
        uint256 amountOut; // Amount after fees
        bool available;
    }

    struct TransferRequest {
        uint256 fromChain;
        uint256 toChain;
        address token;
        uint256 amount;
        address recipient;
    }

    event BridgeAdapterAdded(address indexed adapter, string name);
    event BridgeAdapterRemoved(address indexed adapter);
    event TokenSupportUpdated(address indexed token, bool supported);
    event PriceOracleUpdated(address indexed newOracle);
    event CrossChainTransferInitiated(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fromChain,
        uint256 toChain,
        address recipient,
        address bridgeUsed,
        uint256 timestamp
    );

    constructor(address _priceOracle) Ownable(msg.sender) {
        require(_priceOracle != address(0), "Invalid oracle address");
        priceOracle = IPriceOracle(_priceOracle);
    }

    /**
     * @notice Add a bridge adapter to the router
     * @param adapter Address of the bridge adapter
     */
    function addBridgeAdapter(address adapter) external onlyOwner {
        require(adapter != address(0), "Invalid adapter address");
        require(!isBridgeAdapter[adapter], "Adapter already exists");

        (string memory name, bool supported) = IBridgeAdapter(adapter).getBridgeInfo();
        require(supported, "Bridge not supported");

        bridgeAdapters.push(adapter);
        isBridgeAdapter[adapter] = true;

        emit BridgeAdapterAdded(adapter, name);
    }

    /**
     * @notice Remove a bridge adapter from the router
     * @param adapter Address of the bridge adapter
     */
    function removeBridgeAdapter(address adapter) external onlyOwner {
        require(isBridgeAdapter[adapter], "Adapter not found");

        isBridgeAdapter[adapter] = false;

        // Remove from array
        for (uint256 i = 0; i < bridgeAdapters.length; i++) {
            if (bridgeAdapters[i] == adapter) {
                bridgeAdapters[i] = bridgeAdapters[bridgeAdapters.length - 1];
                bridgeAdapters.pop();
                break;
            }
        }

        emit BridgeAdapterRemoved(adapter);
    }

    /**
     * @notice Update the price oracle
     * @param newOracle Address of the new price oracle
     */
    function updatePriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        priceOracle = IPriceOracle(newOracle);
        emit PriceOracleUpdated(newOracle);
    }

    /**
     * @notice Set token support
     * @param token Token address
     * @param supported Whether the token is supported
     */
    function setTokenSupport(address token, bool supported) external onlyOwner {
        require(token != address(0), "Invalid token address");
        
        if (supported && !supportedTokens[token]) {
            tokenList.push(token);
        } else if (!supported && supportedTokens[token]) {
            // Remove from array
            for (uint256 i = 0; i < tokenList.length; i++) {
                if (tokenList[i] == token) {
                    tokenList[i] = tokenList[tokenList.length - 1];
                    tokenList.pop();
                    break;
                }
            }
        }

        supportedTokens[token] = supported;
        emit TokenSupportUpdated(token, supported);
    }

    /**
     * @notice Get all available routes for a transfer
     * @param request Transfer request details
     * @return routes Array of available routes sorted by total cost
     */
    function getRoutes(TransferRequest memory request) 
        public 
        view 
        returns (RouteInfo[] memory routes) 
    {
        require(supportedTokens[request.token], "Token not supported");
        require(request.amount > 0, "Amount must be greater than 0");

        uint256 routeCount = bridgeAdapters.length;
        RouteInfo[] memory allRoutes = new RouteInfo[](routeCount);
        uint256 validRouteCount = 0;

        // Get routes from all bridge adapters
        for (uint256 i = 0; i < routeCount; i++) {
            IBridgeAdapter adapter = IBridgeAdapter(bridgeAdapters[i]);
            
            try adapter.getRoute(
                request.fromChain,
                request.toChain,
                request.token,
                request.amount
            ) returns (IBridgeAdapter.BridgeRoute memory bridgeRoute) {
                if (bridgeRoute.available) {
                    // Calculate total cost in USD
                    uint256 gasCostUSD = _calculateGasCostUSD(
                        request.toChain,
                        bridgeRoute.estimatedGas
                    );
                    
                    uint256 feeCostUSD = _calculateTokenValueUSD(
                        request.token,
                        bridgeRoute.fee
                    );
                    
                    uint256 totalCostUSD = gasCostUSD + feeCostUSD;
                    uint256 amountOut = request.amount - bridgeRoute.fee;

                    allRoutes[validRouteCount] = RouteInfo({
                        bridgeAdapter: bridgeAdapters[i],
                        bridgeName: bridgeRoute.bridgeName,
                        estimatedTime: bridgeRoute.estimatedTime,
                        estimatedGasCost: gasCostUSD,
                        bridgeFee: bridgeRoute.fee,
                        totalCostUSD: totalCostUSD,
                        amountOut: amountOut,
                        available: true
                    });
                    validRouteCount++;
                }
            } catch {
                // Skip this adapter if it fails
                continue;
            }
        }

        // Create array with only valid routes
        routes = new RouteInfo[](validRouteCount);
        for (uint256 i = 0; i < validRouteCount; i++) {
            routes[i] = allRoutes[i];
        }

        // Sort routes by total cost (bubble sort for simplicity)
        routes = _sortRoutesByCost(routes);

        return routes;
    }

    /**
     * @notice Get the best (cheapest) route for a transfer
     * @param request Transfer request details
     * @return route Best available route
     */
    function getBestRoute(TransferRequest memory request)
        external
        view
        returns (RouteInfo memory route)
    {
        RouteInfo[] memory routes = getRoutes(request);
        require(routes.length > 0, "No routes available");
        return routes[0]; // First route is the cheapest after sorting
    }

    /**
     * @notice Execute a cross-chain transfer using the best route
     * @param toChain Destination chain ID
     * @param token Token address
     * @param amount Amount to transfer
     * @param recipient Recipient address on destination chain
     */
    function executeBestRoute(
        uint256 toChain,
        address token,
        uint256 amount,
        address recipient
    ) external payable nonReentrant returns (bool success) {
        TransferRequest memory request = TransferRequest({
            fromChain: block.chainid,
            toChain: toChain,
            token: token,
            amount: amount,
            recipient: recipient
        });

        RouteInfo[] memory routes = getRoutes(request);
        require(routes.length > 0, "No routes available");

        RouteInfo memory bestRoute = routes[0];
        return _executeBridge(bestRoute, request);
    }

    /**
     * @notice Execute a cross-chain transfer using a specific bridge
     * @param bridgeAdapter Address of the bridge adapter to use
     * @param toChain Destination chain ID
     * @param token Token address
     * @param amount Amount to transfer
     * @param recipient Recipient address on destination chain
     */
    function executeWithBridge(
        address bridgeAdapter,
        uint256 toChain,
        address token,
        uint256 amount,
        address recipient
    ) external payable nonReentrant returns (bool success) {
        require(isBridgeAdapter[bridgeAdapter], "Invalid bridge adapter");
        require(supportedTokens[token], "Token not supported");

        TransferRequest memory request = TransferRequest({
            fromChain: block.chainid,
            toChain: toChain,
            token: token,
            amount: amount,
            recipient: recipient
        });

        // Approve token transfer
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        IERC20(token).safeIncreaseAllowance(bridgeAdapter, amount);

        // Execute bridge
        IBridgeAdapter adapter = IBridgeAdapter(bridgeAdapter);
        bool bridgeSuccess = adapter.bridge{value: msg.value}(
            toChain,
            token,
            amount,
            recipient
        );

        require(bridgeSuccess, "Bridge execution failed");

        // Update statistics
        totalTransfers++;
        try priceOracle.getTokenPrice(token) returns (uint256 price) {
            totalVolumeUSD += (amount * price) / 1e18;
        } catch {
            // If price fetch fails, continue without updating volume
        }

        emit CrossChainTransferInitiated(
            msg.sender,
            token,
            amount,
            block.chainid,
            toChain,
            recipient,
            bridgeAdapter,
            block.timestamp
        );

        return true;
    }

    /**
     * @notice Get list of all bridge adapters
     * @return adapters Array of bridge adapter addresses
     */
    function getBridgeAdapters() external view returns (address[] memory adapters) {
        return bridgeAdapters;
    }

    /**
     * @notice Get list of all supported tokens
     * @return tokens Array of token addresses
     */
    function getSupportedTokens() external view returns (address[] memory tokens) {
        return tokenList;
    }

    /**
     * @notice Get router statistics
     * @return transfers Total number of transfers
     * @return volumeUSD Total volume in USD
     */
    function getStatistics() external view returns (uint256 transfers, uint256 volumeUSD) {
        return (totalTransfers, totalVolumeUSD);
    }

    // Internal functions

    function _executeBridge(RouteInfo memory route, TransferRequest memory request)
        internal
        returns (bool success)
    {
        // Transfer tokens from user to this contract
        IERC20(request.token).safeTransferFrom(msg.sender, address(this), request.amount);
        
        // Approve bridge adapter
        IERC20(request.token).safeIncreaseAllowance(route.bridgeAdapter, request.amount);

        // Execute bridge
        IBridgeAdapter adapter = IBridgeAdapter(route.bridgeAdapter);
        bool bridgeSuccess = adapter.bridge{value: msg.value}(
            request.toChain,
            request.token,
            request.amount,
            request.recipient
        );

        require(bridgeSuccess, "Bridge execution failed");

        // Update statistics
        totalTransfers++;
        try priceOracle.getTokenPrice(request.token) returns (uint256 price) {
            totalVolumeUSD += (request.amount * price) / 1e18;
        } catch {
            // If price fetch fails, continue without updating volume
        }

        emit CrossChainTransferInitiated(
            msg.sender,
            request.token,
            request.amount,
            request.fromChain,
            request.toChain,
            request.recipient,
            route.bridgeAdapter,
            block.timestamp
        );

        return true;
    }

    function _calculateGasCostUSD(uint256 chainId, uint256 gasAmount)
        internal
        view
        returns (uint256)
    {
        try priceOracle.calculateGasCost(chainId, gasAmount) returns (uint256 cost) {
            return cost;
        } catch {
            return 0;
        }
    }

    function _calculateTokenValueUSD(address token, uint256 amount)
        internal
        view
        returns (uint256)
    {
        try priceOracle.getTokenPrice(token) returns (uint256 price) {
            return (amount * price) / 1e18;
        } catch {
            return 0;
        }
    }

    function _sortRoutesByCost(RouteInfo[] memory routes)
        internal
        pure
        returns (RouteInfo[] memory)
    {
        uint256 n = routes.length;
        for (uint256 i = 0; i < n; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (routes[j].totalCostUSD > routes[j + 1].totalCostUSD) {
                    RouteInfo memory temp = routes[j];
                    routes[j] = routes[j + 1];
                    routes[j + 1] = temp;
                }
            }
        }
        return routes;
    }

    /**
     * @notice Emergency withdraw function
     * @param token Token to withdraw
     */
    function emergencyWithdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    // Receive function to accept ETH for gas payments
    receive() external payable {}
}


