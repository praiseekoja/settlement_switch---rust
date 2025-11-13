import { useEffect, useState } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract } from 'wagmi';
import { CONTRACTS } from '../config';
import { ROUTER_ABI } from '../contracts/router';

export interface TransferRequest {
  fromChain: bigint;
  toChain: bigint;
  token: `0x${string}`;
  amount: bigint;
  recipient: `0x${string}`;
}

export interface RouteInfo {
  bridgeAdapter: `0x${string}`;
  bridgeName: string;
  estimatedTime: bigint;
  estimatedGasCost: bigint;
  bridgeFee: bigint;
  totalCostUSD: bigint;
  amountOut: bigint;
  available: boolean;
}

export function useRouter() {
  const chainId = useChainId();
  const { address, isConnected } = useAccount();
  const [routerAddress, setRouterAddress] = useState<`0x${string}`>();

  // Update router address when chain changes
  useEffect(() => {
    if (chainId && CONTRACTS[chainId]?.router) {
      setRouterAddress(CONTRACTS[chainId].router as `0x${string}`);
    }
  }, [chainId]);

  // Get best route
  const useFindBestRoute = (request?: TransferRequest) => {
    return useReadContract({
      address: routerAddress,
      abi: ROUTER_ABI,
      functionName: 'findBestRoute',
      args: request ? [request] : undefined,
      query: {
        enabled: !!routerAddress && !!request && isConnected,
      },
    });
  };

  // Execute transfer
  const useExecuteTransfer = () => {
    return useWriteContract();
  };

  return {
    routerAddress,
    chainId,
    address,
    isConnected,
    useFindBestRoute,
    useExecuteTransfer,
  };
}
