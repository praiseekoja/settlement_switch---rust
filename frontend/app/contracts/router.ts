export const ROUTER_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "priceOracle",
        "type": "address"
      }
    ]
  },
  {
    "type": "function",
    "name": "findBestRoute",
    "inputs": [
      {
        "name": "request",
        "type": "tuple",
        "components": [
          {
            "name": "fromChain",
            "type": "uint256"
          },
          {
            "name": "toChain",
            "type": "uint256"
          },
          {
            "name": "token",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          },
          {
            "name": "recipient",
            "type": "address"
          }
        ]
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          {
            "name": "bridgeAdapter",
            "type": "address"
          },
          {
            "name": "bridgeName",
            "type": "string"
          },
          {
            "name": "estimatedTime",
            "type": "uint256"
          },
          {
            "name": "estimatedGasCost",
            "type": "uint256"
          },
          {
            "name": "bridgeFee",
            "type": "uint256"
          },
          {
            "name": "totalCostUSD",
            "type": "uint256"
          },
          {
            "name": "amountOut",
            "type": "uint256"
          },
          {
            "name": "available",
            "type": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "executeTransfer",
    "inputs": [
      {
        "name": "request",
        "type": "tuple",
        "components": [
          {
            "name": "fromChain",
            "type": "uint256"
          },
          {
            "name": "toChain",
            "type": "uint256"
          },
          {
            "name": "token",
            "type": "address"
          },
          {
            "name": "amount",
            "type": "uint256"
          },
          {
            "name": "recipient",
            "type": "address"
          }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  }
];