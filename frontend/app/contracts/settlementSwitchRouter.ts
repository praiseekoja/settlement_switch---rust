/**
 * SettlementSwitch Router ABI
 * Generated from Stylus contract
 * 
 * This is the full router implementation with bridge adapter support
 */

export const SETTLEMENT_SWITCH_ROUTER_ABI = [
  {
    type: 'function',
    name: 'initialize',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'price_oracle', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'addBridgeAdapter',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_adapter', type: 'address' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getRoutes',
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
        name: '',
        type: 'tuple[]',
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
      },
    ],
  },
  {
    type: 'function',
    name: 'executeBestRoute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_to_chain', type: 'uint256' },
      { name: '_token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'getTotalTransfers',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getAdapterCount',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

