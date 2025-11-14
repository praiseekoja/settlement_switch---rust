// Test if routes work
const { createPublicClient, http, parseUnits } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const USDC_ADDRESS = '0xcb5CC1A9090CF15333CD85e792901AAEeF63bF52';

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

const ABI = [
  {
    name: 'get_routes',
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
];

async function testRoutes() {
  console.log('🧪 Testing get_routes function...');
  console.log('Contract:', CONTRACT_ADDRESS);
  console.log('');

  try {
    const routes = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_routes',
      args: [
        421614n, // Arbitrum Sepolia
        80002n,  // Polygon Amoy
        USDC_ADDRESS,
        parseUnits('100', 6),
        '0xba05Ac1D2bD65eC83d8F5B708CB7B51B661A9d27',
      ],
    });

    console.log('✅ SUCCESS! Routes returned:', routes.length);
    console.log('');
    
    if (routes.length > 0) {
      console.log('📋 Route details:');
      routes.forEach((route, i) => {
        console.log(`\n  Route ${i + 1}:`);
        console.log(`    Bridge: ${route[1]}`);
        console.log(`    Time: ${route[2].toString()}s`);
        console.log(`    Gas Cost: ${route[3].toString()}`);
        console.log(`    Bridge Fee: ${route[4].toString()}`);
        console.log(`    Total Cost USD: $${(Number(route[5]) / 1e8).toFixed(4)}`);
        console.log(`    Amount Out: ${(Number(route[6]) / 1e6).toFixed(2)} USDC`);
        console.log(`    Available: ${route[7]}`);
      });
      console.log('');
      console.log('🎉 Your contract is working!');
      console.log('   Routes should appear in the frontend.');
    } else {
      console.log('⚠️  No routes returned.');
      console.log('   The contract might not have adapters configured.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('This might mean:');
    console.log('  1. The contract is not deployed at this address');
    console.log('  2. The ABI doesn\'t match the deployed contract');
    console.log('  3. The contract has a different implementation');
  }
}

testRoutes();

