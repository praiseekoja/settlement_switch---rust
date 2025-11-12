import { useEffect, useState } from 'react';
import { useContractRead, useContractWrite, useNetwork } from 'wagmi';
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
  const { chain } = useNetwork();
  const [routerAddress, setRouterAddress] = useState<`0x${string}`>();

  // Update router address when chain changes
  useEffect(() => {
    if (chain?.id && CONTRACTS[chain.id]?.router) {
      setRouterAddress(CONTRACTS[chain.id].router as `0x${string}`);
    }
  }, [chain]);

  // Get best route
  const useFindBestRoute = (request?: TransferRequest) => {
    return useContractRead({
      address: routerAddress,
      abi: ROUTER_ABI,
      functionName: 'findBestRoute',
      args: request ? [request] : undefined,
      enabled: !!routerAddress && !!request,
    });
  };

  // Execute transfer
  const useExecuteTransfer = () => {
    return useContractWrite({
      address: routerAddress,
      abi: ROUTER_ABI,
      functionName: 'executeTransfer',
    });
  };

  return {
    routerAddress,
    useFindBestRoute,
    useExecuteTransfer,
  };
}