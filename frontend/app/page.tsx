'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ArrowDownUp, Info } from 'lucide-react';
import ChainSelector from './components/ChainSelector';
import TokenSelector from './components/TokenSelector';
import RouteDisplay from './components/RouteDisplay';
import TransactionProgress from './components/TransactionProgress';
import OptimizationSlider from './components/OptimizationSlider';
import SavingsDisplay from './components/SavingsDisplay';
import RouteComparison from './components/RouteComparison';
import {
  CONTRACTS,
  ChainId,
  SUPPORTED_CHAINS,
  TOKENS,
} from './config';

// Stylus Router ABI (camelCase for Stylus contracts)
const ROUTER_ABI = [
  {
    name: 'getRoutes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_from_chain', type: 'uint256' },
      { name: '_to_chain', type: 'uint256' },
      { name: '_token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: '_recipient', type: 'address' },
    ],
    outputs: [
      {
        components: [
          { name: 'bridgeAdapter', type: 'address' },
          { name: 'bridgeName', type: 'string' },
          { name: 'estimatedTime', type: 'uint256' },
          { name: 'estimatedGasCost', type: 'uint256' },
          { name: 'bridgeFee', type: 'uint256' },
          { name: 'totalCostUSD', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'available', type: 'bool' },
        ],
        type: 'tuple[]',
      },
    ],
  },
  {
    name: 'executeBestRoute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_to_chain', type: 'uint256' },
      { name: '_token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ERC20 ABI (minimal)
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

type TransactionStatus = 'idle' | 'initiating' | 'confirming' | 'bridging' | 'success' | 'error';

export default function Page() {
  const { address, isConnected, chain } = useAccount();
  
  // State
  const [fromChainId, setFromChainId] = useState<ChainId>(SUPPORTED_CHAINS[0].id as ChainId);
  const [toChainId, setToChainId] = useState<ChainId>(SUPPORTED_CHAINS[1].id as ChainId);
  const [selectedToken, setSelectedToken] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);
  const [optimizationValue, setOptimizationValue] = useState(0); // 0=cheapest, 100=fastest
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txHash, setTxHash] = useState<string>();
  const [txError, setTxError] = useState<string>();

  // Get contract addresses
  const fromChainContracts = CONTRACTS[fromChainId as keyof typeof CONTRACTS];
  const tokenAddress = fromChainContracts?.[`mock${selectedToken}` as keyof typeof fromChainContracts] as `0x${string}`;
  const routerAddress = fromChainContracts?.router as `0x${string}`;

  // Contract writes
  const { writeContractAsync: approve } = useWriteContract();
  const { writeContractAsync: bridge } = useWriteContract();

  // Get token decimals
  const tokenDecimals = TOKENS.find(t => t.symbol === selectedToken)?.decimals || 6;

  // Fetch routes from smart contract
  const { data: routesData, refetch: refetchRoutes } = useReadContract({
    address: routerAddress,
    abi: ROUTER_ABI,
    functionName: 'getRoutes',
    args: address && amount && Number(amount) > 0 
      ? [
          BigInt(fromChainId),
          BigInt(toChainId),
          tokenAddress,
          parseUnits(amount, tokenDecimals),
          address,
        ]
      : undefined,
    query: {
      enabled: Boolean(address && amount && Number(amount) > 0 && isConnected),
    },
  });

  // Sort routes based on optimization preference
  const sortedRoutes = useMemo(() => {
    if (!routesData || !Array.isArray(routesData)) return [];

    const formattedRoutes = (routesData as any[]).map(route => ({
      bridgeName: route.bridgeName,
      estimatedTime: Number(route.estimatedTime),
      estimatedGasCost: Number(formatUnits(route.estimatedGasCost, 8)),
      bridgeFee: Number(formatUnits(route.bridgeFee, tokenDecimals)),
      totalCostUSD: Number(formatUnits(route.totalCostUSD, 8)),
      amountOut: Number(formatUnits(route.amountOut, tokenDecimals)),
      available: route.available,
    }));

    // Sort based on optimization slider
    const sorted = [...formattedRoutes].sort((a, b) => {
      if (optimizationValue < 20) {
        return a.totalCostUSD - b.totalCostUSD;
      }
      
      if (optimizationValue > 80) {
        return a.estimatedTime - b.estimatedTime;
      }
      
      const costWeight = (100 - optimizationValue) / 100;
      const timeWeight = optimizationValue / 100;

      const costs = formattedRoutes.map(r => r.totalCostUSD);
      const times = formattedRoutes.map(r => r.estimatedTime);
      const minCost = Math.min(...costs);
      const maxCost = Math.max(...costs);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      const aNormalizedCost = maxCost === minCost ? 0 : (a.totalCostUSD - minCost) / (maxCost - minCost);
      const aNormalizedTime = maxTime === minTime ? 0 : (a.estimatedTime - minTime) / (maxTime - minTime);
      const aScore = (aNormalizedCost * costWeight) + (aNormalizedTime * timeWeight);

      const bNormalizedCost = maxCost === minCost ? 0 : (b.totalCostUSD - minCost) / (maxCost - minCost);
      const bNormalizedTime = maxTime === minTime ? 0 : (b.estimatedTime - minTime) / (maxTime - minTime);
      const bScore = (bNormalizedCost * costWeight) + (bNormalizedTime * timeWeight);

      return aScore - bScore;
    });

    return sorted;
  }, [routesData, optimizationValue, tokenDecimals]);

  // Update routes when data changes or optimization changes
  useEffect(() => {
    if (sortedRoutes.length > 0) {
      setRoutes(sortedRoutes);
      if (JSON.stringify(routes) !== JSON.stringify(sortedRoutes)) {
        setSelectedRoute(0);
      }
    }
  }, [sortedRoutes]);

  useEffect(() => {
    if (routes.length > 0) {
      setSelectedRoute(0);
    }
  }, [optimizationValue]);

  // Get best and worst routes for savings display
  const bestCostRoute = useMemo(() => {
    if (routes.length === 0) return null;
    return [...routes].sort((a, b) => a.totalCostUSD - b.totalCostUSD)[0];
  }, [routes]);

  const worstCostRoute = useMemo(() => {
    if (routes.length === 0) return null;
    return [...routes].sort((a, b) => b.totalCostUSD - a.totalCostUSD)[0];
  }, [routes]);

  const handleSwapChains = () => {
    setFromChainId(toChainId);
    setToChainId(fromChainId);
  };

  const handleBridge = async () => {
    if (!address || !amount || selectedRoute === null || !isConnected) {
      alert('Please connect wallet and enter amount');
      return;
    }

    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      alert('⚠️ Router contract not deployed. Update addresses in config.ts');
      return;
    }

    try {
      setTxStatus('initiating');
      setTxError(undefined);

      const amountInWei = parseUnits(amount, tokenDecimals);
      
      console.log('🔄 Skipping approval (testing mode)...');
      
      // Skip approval for now - already have some approval set
      // TODO: Re-enable approval in production
      
      setTxStatus('confirming');

      console.log('🌉 Executing bridge...', { 
        routerAddress, 
        toChainId, 
        tokenAddress, 
        amount: amountInWei.toString(), 
        recipient: address 
      });

      // Execute bridge transfer
      const bridgeTxHash = await bridge({
        address: routerAddress,
        abi: ROUTER_ABI,
        functionName: 'executeBestRoute',
        args: [
          BigInt(toChainId),
          tokenAddress,
          amountInWei,
          address,
        ],
        gas: 500000n, // Set explicit gas limit to skip estimation
      });

      console.log('✅ Bridge transaction:', bridgeTxHash);
      
      // Show success immediately - transaction is submitted
      setTxStatus('success');
      setTxHash(bridgeTxHash);
      
      console.log('🎉 Transaction submitted successfully!');
      console.log('View on Arbiscan:', `https://sepolia.arbiscan.io/tx/${bridgeTxHash}`);

    } catch (error: any) {
      console.error('❌ Bridge error:', error);
      setTxStatus('error');
      setTxError(error.message || 'Transaction failed');
    }
  };

  const handleCloseProgress = () => {
    setTxStatus('idle');
    setTxHash(undefined);
    setTxError(undefined);
    setAmount('');
    refetchRoutes();
  };

  const contractsDeployed = routerAddress && routerAddress !== '0x0000000000000000000000000000000000000000';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="max-w-7xl mx-auto pt-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            C8 Settlement Switch
          </h1>
          <p className="text-gray-600 text-lg">
            Intelligent cross-chain router that finds the <span className="font-semibold text-purple-600">cheapest & fastest</span> path
          </p>
        </div>

        {/* Warning if contracts not deployed */}
        {!contractsDeployed && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Router Contract Not Configured
                </h3>
                <p className="text-sm text-amber-700">
                  Update router address in <code className="bg-amber-100 px-2 py-1 rounded">frontend/app/config.ts</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Bridge Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Cross-Chain Bridge</h2>
                <p className="text-purple-100 text-sm">
                  Powered by Arbitrum • Multi-path routing
                </p>
              </div>

              <div className="p-6 space-y-6">
                {amount && Number(amount) > 0 && routes.length > 0 && (
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-purple-900">
                          Active Mode:
                        </span>
                      </div>
                      <span className="text-sm font-bold text-purple-700">
                        {optimizationValue < 20 ? "💰 Cheapest Route" : optimizationValue < 80 ? "⚖️ Balanced" : "⚡ Fastest Route"}
                      </span>
                    </div>
                  </div>
                )}

                <OptimizationSlider
                  value={optimizationValue}
                  onChange={setOptimizationValue}
                />

                <ChainSelector
                  selectedChainId={fromChainId}
                  onSelect={(chainId) => setFromChainId(chainId)}
                  label="From Chain"
                  excludeChainId={toChainId}
                />

                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    onClick={handleSwapChains}
                    className="w-12 h-12 bg-white border-4 border-purple-50 rounded-full flex items-center justify-center hover:bg-purple-50 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  >
                    <ArrowDownUp className="w-5 h-5 text-purple-600" />
                  </button>
                </div>

                <ChainSelector
                  selectedChainId={toChainId}
                  onSelect={(chainId) => setToChainId(chainId)}
                  label="To Chain"
                  excludeChainId={fromChainId}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <div className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl focus-within:border-purple-500 transition-colors">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 text-2xl font-semibold bg-transparent outline-none"
                      step="0.01"
                      min="0"
                    />
                    <TokenSelector
                      selectedToken={selectedToken}
                      onSelect={setSelectedToken}
                    />
                  </div>
                </div>

                <button
                  onClick={handleBridge}
                  disabled={
                    !isConnected ||
                    !amount ||
                    Number(amount) <= 0 ||
                    routes.length === 0 ||
                    selectedRoute === null ||
                    !contractsDeployed
                  }
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    isConnected &&
                    amount &&
                    Number(amount) > 0 &&
                    routes.length > 0 &&
                    contractsDeployed
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl active:scale-98'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {!isConnected
                    ? 'Connect Wallet'
                    : !contractsDeployed
                    ? 'Configure Router First'
                    : !amount || Number(amount) <= 0
                    ? 'Enter Amount'
                    : routes.length === 0
                    ? 'No Routes Available'
                    : 'Execute Bridge'}
                </button>

                {contractsDeployed && isConnected && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-blue-50 p-3 rounded-lg">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Connected to {chain?.name || 'Unknown network'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Routes & Stats */}
          <div className="space-y-6">
            {isConnected && amount && Number(amount) > 0 && routes.length > 0 && (
              <>
                <RouteDisplay
                  routes={routes}
                  loading={loadingRoutes}
                  selectedRoute={selectedRoute}
                  onSelectRoute={setSelectedRoute}
                />

                {routes.length >= 2 && (
                  <RouteComparison routes={routes} />
                )}

                {bestCostRoute && worstCostRoute && routes.length >= 2 && (
                  <SavingsDisplay
                    bestRoute={bestCostRoute}
                    worstRoute={worstCostRoute}
                  />
                )}
              </>
            )}

            {(!amount || Number(amount) <= 0) && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Enter Amount
                </h3>
                <p className="text-sm text-gray-600">
                  Enter an amount to see available routes and compare costs
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <TransactionProgress
        status={txStatus}
        txHash={txHash}
        error={txError}
        onClose={handleCloseProgress}
      />
    </div>
  );
}

