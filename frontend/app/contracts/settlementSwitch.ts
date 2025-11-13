export const SETTLEMENT_SWITCH_ABI = [
  {
    type: 'function',
    name: 'getCounter',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'setCounter',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'newValue', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'increment',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

