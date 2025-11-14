'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ArrowDownUp, Info, Loader2, PenSquare, Plus, RefreshCcw } from 'lucide-react';
import ChainSelector from './components/ChainSelector';
import TokenSelector from './components/TokenSelector';
import RouteDisplay from './components/RouteDisplay';
import TransactionProgress from './components/TransactionProgress';
import OptimizationSlider from './components/OptimizationSlider';
import SavingsDisplay from './components/SavingsDisplay';
import RouteComparison from './components/RouteComparison';
import {
  CONTRACTS,
  ENABLE_STYLUS_MODE,
  ChainId,
  STYLUS_CONTRACT_ADDRESS,
  STYLUS_ROUTER_ADDRESS,
  SUPPORTED_CHAINS,
  TOKENS,
} from './config';
import { SETTLEMENT_SWITCH_ABI } from './contracts/settlementSwitch';
import { SETTLEMENT_SWITCH_ROUTER_ABI } from './contracts/settlementSwitchRouter';

// Solidity Router ABI (for legacy mode)
const SOLIDITY_ROUTER_ABI = [
  {
    name: 'getRoutes',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      {
        components: [
          { name: 'fromChain', type: 'uint256' },
          { name: 'toChain', type: 'uint256' },
          { name: 'token', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'recipient', type: 'address' },
        ],
        name: 'request',
        type: 'tuple',
      },
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
        name: 'routes',
        type: 'tuple[]',
      },
    ],
  },
  {
    name: 'executeBestRoute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'toChain', type: 'uint256' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
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
type StylusStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

export default function Page() {
  return ENABLE_STYLUS_MODE ? <StylusDemoPage /> : <LegacyBridgePage />;
}

function StylusDemoPage() {
  const { address, isConnected, chain } = useAccount();
  const [inputValue, setInputValue] = useState('');
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txStatus, setTxStatus] = useState<StylusStatus>('idle');
  const [txError, setTxError] = useState<string>();
  const [lastAction, setLastAction] = useState<'increment' | 'set' | null>(null);

  const contractAddress = STYLUS_CONTRACT_ADDRESS;

  const {
    data: counterData,
    refetch: refetchCounter,
    status: counterStatus,
    fetchStatus: counterFetchStatus,
  } = useReadContract({
    address: contractAddress,
    abi: SETTLEMENT_SWITCH_ABI,
    functionName: 'getCounter',
    query: {
      enabled: Boolean(contractAddress),
    },
  });

  const isCounterLoading =
    counterStatus === 'pending' || counterFetchStatus === 'fetching';

  const { writeContract: sendTransaction, data: pendingHash } = useWriteContract();

  useEffect(() => {
    if (pendingHash) {
      setTxHash(pendingHash);
    }
  }, [pendingHash]);

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash),
    },
  });

  useEffect(() => {
    if (txHash) {
      setTxStatus(isConfirming ? 'confirming' : 'pending');
    }
  }, [isConfirming, txHash]);

  useEffect(() => {
    if (isConfirmed) {
      setTxStatus('success');
      setTxHash(undefined);
      setInputValue('');
      refetchCounter();
      const timeout = setTimeout(() => {
        setTxStatus('idle');
        setLastAction(null);
      }, 2500);
      return () => clearTimeout(timeout);
    }
    return;
  }, [isConfirmed, refetchCounter]);

  const parsedCounter =
    counterData !== undefined ? counterData.toString() : undefined;

  const ensureReady = () => {
    if (!contractAddress) {
      setTxError('Contract address is not configured. Set NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS.');
      return false;
    }
    if (!isConnected || !address) {
      setTxError('Connect your wallet to interact with the contract.');
      return false;
    }
    setTxError(undefined);
    return true;
  };

  const handleIncrement = async () => {
    if (!ensureReady() || !contractAddress) {
      return;
    }

    try {
      setTxStatus('pending');
      setLastAction('increment');
      await sendTransaction({
        address: contractAddress,
        abi: SETTLEMENT_SWITCH_ABI,
        functionName: 'increment',
      });
    } catch (error: any) {
      console.error('Increment failed:', error);
      setTxStatus('error');
      setTxError(error?.message || 'Increment failed');
    }
  };

  const handleSetCounter = async () => {
    if (!ensureReady() || !contractAddress) {
      return;
    }

    const sanitized = inputValue.trim();
    if (sanitized === '') {
      setTxError('Enter a value to set.');
      return;
    }

    let value: bigint;
    try {
      value = BigInt(sanitized);
    } catch {
      setTxError('Value must be an integer.');
      return;
    }

    try {
      setTxStatus('pending');
      setLastAction('set');
      await sendTransaction({
        address: contractAddress,
        abi: SETTLEMENT_SWITCH_ABI,
        functionName: 'setCounter',
        args: [value],
      });
    } catch (error: any) {
      console.error('Set counter failed:', error);
      setTxStatus('error');
      setTxError(error?.message || 'Set counter failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto pt-10 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Settlement Switch Stylus
          </h1>
          <p className="text-gray-600">
            Interact with the Stylus-deployed <span className="font-semibold text-purple-600">SettlementSwitch</span> contract by reading and updating its on-chain counter.
          </p>
        </div>

        {!contractAddress && (
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-amber-900 text-sm">
            <strong className="block mb-1">Missing contract address</strong>
            Set <code className="bg-amber-100 px-2 py-1 rounded">NEXT_PUBLIC_STYLUS_CONTRACT_ADDRESS</code> to the deployed Stylus contract address.
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Counter</h2>
              <p className="text-sm text-gray-500">
                Current value stored in Stylus contract
              </p>
            </div>
            <button
              onClick={() => refetchCounter()}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 transition"
              disabled={isCounterLoading}
            >
              {isCounterLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCcw className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 flex flex-col items-center gap-2">
            <span className="uppercase tracking-wide text-xs text-purple-100">
              Current Counter
            </span>
            <span className="text-6xl font-bold">
              {parsedCounter ?? '—'}
            </span>
            <span className="text-sm text-purple-100">
              {isConnected && address ? `Connected as ${address.slice(0, 6)}…${address.slice(-4)}` : 'Connect wallet to interact'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleIncrement}
              disabled={!contractAddress || !isConnected || txStatus === 'pending' || txStatus === 'confirming'}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <Plus className="w-5 h-5" />
              Increment Counter
            </button>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Set counter value"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
                min="0"
              />
              <button
                onClick={handleSetCounter}
                disabled={
                  !contractAddress ||
                  !isConnected ||
                  inputValue.trim() === '' ||
                  txStatus === 'pending' ||
                  txStatus === 'confirming'
                }
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-purple-600 border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <PenSquare className="w-5 h-5" />
                Set Counter
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="w-4 h-4 text-purple-500" />
              <span>
                Transactions are executed against the Stylus contract on Arbitrum. Ensure your wallet is connected to the correct network.
              </span>
            </div>
            {chain && (
              <div className="text-xs text-gray-500">
                Current network: <span className="font-semibold text-gray-700">{chain.name}</span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-700">Status:</span>
              <span className="text-purple-700 capitalize">{txStatus}</span>
              {txStatus === 'pending' || txStatus === 'confirming' ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              ) : null}
            </div>
            {lastAction && (
              <div className="text-xs text-purple-700">
                Last action: {lastAction === 'increment' ? 'Increment counter' : 'Set counter value'}
              </div>
            )}
            {txError && (
              <div className="text-xs text-rose-600">
                {txError}
              </div>
            )}
            {txHash && (
              <div className="text-xs text-purple-600 break-all">
                Tx hash: {txHash}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegacyBridgePage() {
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

  // Determine which router to use
  const useStylusRouter = ENABLE_STYLUS_MODE && STYLUS_ROUTER_ADDRESS;
  const ROUTER_ABI = useStylusRouter ? SETTLEMENT_SWITCH_ROUTER_ABI : SOLIDITY_ROUTER_ABI;

  // Get contract addresses
  const fromChainContracts = CONTRACTS[fromChainId as keyof typeof CONTRACTS];
  const tokenAddress = fromChainContracts?.[`mock${selectedToken}` as keyof typeof fromChainContracts] as `0x${string}`;
  const routerAddress = useStylusRouter 
    ? STYLUS_ROUTER_ADDRESS 
    : (fromChainContracts?.router as `0x${string}`);

  // Contract writes
  const { writeContract: approve } = useWriteContract();
  const { writeContract: bridge, data: bridgeTxHash } = useWriteContract();

  // Wait for bridge transaction
  const { isLoading: isBridging, isSuccess: bridgeSuccess } = useWaitForTransactionReceipt({
    hash: bridgeTxHash,
  });

  // Update transaction status
  useEffect(() => {
    if (isBridging) {
      setTxStatus('bridging');
    } else if (bridgeSuccess) {
      setTxStatus('success');
      setTxHash(bridgeTxHash);
    }
  }, [isBridging, bridgeSuccess, bridgeTxHash]);

  // Get token decimals
  const tokenDecimals = TOKENS.find(t => t.symbol === selectedToken)?.decimals || 6;

  // Fetch routes from smart contract
  const { data: routesData, refetch: refetchRoutes } = useReadContract({
    address: routerAddress,
    abi: ROUTER_ABI,
    functionName: 'getRoutes',
    args: address && amount && Number(amount) > 0 
      ? useStylusRouter
        ? [
            // Stylus: individual parameters
            BigInt(fromChainId),
            BigInt(toChainId),
            tokenAddress,
            parseUnits(amount, tokenDecimals),
            address,
          ]
        : [
            // Solidity: tuple parameter
            {
              fromChain: BigInt(fromChainId),
              toChain: BigInt(toChainId),
              token: tokenAddress,
              amount: parseUnits(amount, tokenDecimals),
              recipient: address,
            }
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
    // 0-100: 0=pure cost optimization, 100=pure time optimization
    const sorted = [...formattedRoutes].sort((a, b) => {
      // Pure cost optimization (0-20)
      if (optimizationValue < 20) {
        return a.totalCostUSD - b.totalCostUSD;
      }
      
      // Pure time optimization (80-100)
      if (optimizationValue > 80) {
        return a.estimatedTime - b.estimatedTime;
      }
      
      // Balanced approach (20-80) - weighted score
      const costWeight = (100 - optimizationValue) / 100;
      const timeWeight = optimizationValue / 100;

      // Get min/max for normalization to avoid division by zero
      const costs = formattedRoutes.map(r => r.totalCostUSD);
      const times = formattedRoutes.map(r => r.estimatedTime);
      const minCost = Math.min(...costs);
      const maxCost = Math.max(...costs);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      // Normalize to 0-1 scale (handle edge case where all values are same)
      const aNormalizedCost = maxCost === minCost ? 0 : (a.totalCostUSD - minCost) / (maxCost - minCost);
      const aNormalizedTime = maxTime === minTime ? 0 : (a.estimatedTime - minTime) / (maxTime - minTime);
      const aScore = (aNormalizedCost * costWeight) + (aNormalizedTime * timeWeight);

      const bNormalizedCost = maxCost === minCost ? 0 : (b.totalCostUSD - minCost) / (maxCost - minCost);
      const bNormalizedTime = maxTime === minTime ? 0 : (b.estimatedTime - minTime) / (maxTime - minTime);
      const bScore = (bNormalizedCost * costWeight) + (bNormalizedTime * timeWeight);

      return aScore - bScore;
    });

    // Log for debugging
    console.log('🔄 Routes sorted with optimization:', optimizationValue);
    console.log('📊 Sorted routes:', sorted.map(r => ({
      name: r.bridgeName,
      cost: r.totalCostUSD.toFixed(6),
      time: r.estimatedTime + 's'
    })));

    return sorted;
  }, [routesData, optimizationValue, tokenDecimals]);

  // Update routes when data changes or optimization changes
  useEffect(() => {
    if (sortedRoutes.length > 0) {
      setRoutes(sortedRoutes);
      // Only auto-select if routes changed from smart contract, not from slider
      if (JSON.stringify(routes) !== JSON.stringify(sortedRoutes)) {
        setSelectedRoute(0); // Auto-select optimized route
      }
    }
  }, [sortedRoutes]);

  // Force re-render when optimization changes
  useEffect(() => {
    if (routes.length > 0) {
      setSelectedRoute(0); // Select new best route when optimization changes
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

  // Swap chains
  const handleSwapChains = () => {
    setFromChainId(toChainId);
    setToChainId(fromChainId);
  };

  // Handle bridge transaction
  const handleBridge = async () => {
    if (!address || !amount || selectedRoute === null || !isConnected) {
      alert('Please connect wallet and enter amount');
      return;
    }

    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      alert('⚠️ Please deploy contracts first and update addresses in config.ts');
      return;
    }

    try {
      setTxStatus('initiating');
      setTxError(undefined);

      // Step 1: Approve token
      const amountInWei = parseUnits(amount, tokenDecimals);
      
      await approve({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [routerAddress, amountInWei],
      });

      setTxStatus('confirming');

      // Step 2: Execute bridge
      await bridge({
        address: routerAddress,
        abi: ROUTER_ABI,
        functionName: 'executeBestRoute',
        args: [
          BigInt(toChainId),
          tokenAddress,
          amountInWei,
          address,
        ],
      });

    } catch (error: any) {
      console.error('Bridge error:', error);
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

  // Check if contracts are deployed
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
          {useStylusRouter && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 border-2 border-purple-300 rounded-full">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-purple-900">
                ⚡ Powered by Arbitrum Stylus (10x cheaper gas)
              </span>
            </div>
          )}
        </div>

        {/* Warning if contracts not deployed */}
        {!contractsDeployed && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">
                  Contracts Not Deployed
                </h3>
                <p className="text-sm text-amber-700">
                  Deploy contracts first: <code className="bg-amber-100 px-2 py-1 rounded">cd contract && npm run deploy:all</code>
                  <br />Then update addresses in <code className="bg-amber-100 px-2 py-1 rounded">frontend/app/config.ts</code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Bridge Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Cross-Chain Bridge</h2>
                <p className="text-purple-100 text-sm">
                  Powered by Arbitrum • Multi-path routing
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Current Mode Indicator */}
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

                {/* Optimization Slider */}
                <OptimizationSlider
                  value={optimizationValue}
                  onChange={setOptimizationValue}
                />

                {/* From Chain */}
                <ChainSelector
                  selectedChainId={fromChainId}
                  onSelect={(chainId) => setFromChainId(chainId)}
                  label="From Chain"
                  excludeChainId={toChainId}
                />

                {/* Swap Button */}
                <div className="flex justify-center -my-3 relative z-10">
                  <button
                    onClick={handleSwapChains}
                    className="w-12 h-12 bg-white border-4 border-purple-50 rounded-full flex items-center justify-center hover:bg-purple-50 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  >
                    <ArrowDownUp className="w-5 h-5 text-purple-600" />
                  </button>
                </div>

                {/* To Chain */}
                <ChainSelector
                  selectedChainId={toChainId}
                  onSelect={(chainId) => setToChainId(chainId)}
                  label="To Chain"
                  excludeChainId={fromChainId}
                />

                {/* Amount Input */}
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

                {/* Bridge Button */}
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
                    ? 'Deploy Contracts First'
                    : !amount || Number(amount) <= 0
                    ? 'Enter Amount'
                    : routes.length === 0
                    ? 'No Routes Available'
                    : 'Execute Bridge'}
                </button>

                {/* Info */}
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
            {/* Routes Display */}
            {isConnected && amount && Number(amount) > 0 && routes.length > 0 && (
              <>
                <RouteDisplay
                  routes={routes}
                  loading={loadingRoutes}
                  selectedRoute={selectedRoute}
                  onSelectRoute={setSelectedRoute}
                />

                {/* Route Comparison */}
                {routes.length >= 2 && (
                  <RouteComparison routes={routes} />
                )}

                {/* Savings Display */}
                {bestCostRoute && worstCostRoute && routes.length >= 2 && (
                  <SavingsDisplay
                    bestRoute={bestCostRoute}
                    worstRoute={worstCostRoute}
                  />
                )}
              </>
            )}

            {/* Empty State */}
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

      {/* Transaction Progress Modal */}
      <TransactionProgress
        status={txStatus}
        txHash={txHash}
        error={txError}
        onClose={handleCloseProgress}
      />
    </div>
  );
}
