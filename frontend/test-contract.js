// Quick test script to verify Stylus contract
const { createPublicClient, http, parseUnits } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';

const ABI = [
  {
    name: 'get_adapter_count',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
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

async function testContract() {
  console.log('🔍 Testing Stylus Contract:', CONTRACT_ADDRESS);
  console.log('');

  try {
    // Test 1: Check adapter count
    console.log('📊 Test 1: Checking adapter count...');
    const adapterCount = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_adapter_count',
    });
    console.log('✅ Adapter count:', adapterCount.toString());
    console.log('');

    if (adapterCount === 0n) {
      console.log('⚠️  WARNING: No adapters configured!');
      console.log('   The contract needs at least 1 adapter to return routes.');
      console.log('   Call add_bridge_adapter() on the contract first.');
      console.log('');
    }

    // Test 2: Try to get routes
    console.log('📊 Test 2: Fetching routes...');
    const routes = await client.readContract({
      address: CONTRACT_ADDRESS,
      abi: ABI,
      functionName: 'get_routes',
      args: [
        421614n, // Arbitrum Sepolia
        80002n,  // Polygon Amoy
        '0xcb5CC1A9090CF15333CD85e792901AAEeF63bF52', // Mock USDC
        parseUnits('100', 6), // 100 USDC
        '0x0000000000000000000000000000000000000001', // Dummy recipient
      ],
    });

    console.log('✅ Routes returned:', routes.length);
    if (routes.length > 0) {
      console.log('');
      console.log('📋 Route details:');
      routes.forEach((route, i) => {
        console.log(`   Route ${i + 1}:`);
        console.log(`     Bridge: ${route[1]}`);
        console.log(`     Time: ${route[2].toString()}s`);
        console.log(`     Gas Cost: $${(Number(route[3]) / 1e8).toFixed(4)}`);
        console.log(`     Available: ${route[7]}`);
      });
    } else {
      console.log('⚠️  No routes returned (adapter_count might be 0)');
    }
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Invalid amount')) {
      console.log('   → Contract rejected: Invalid amount');
    } else if (error.message.includes('No adapters')) {
      console.log('   → Contract rejected: No adapters available');
    }
  }

  console.log('');
  console.log('✅ Test complete!');
}

testContract();

