// Quick check if contract is working
const { createPublicClient, http, parseUnits } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';
const USDC = '0xcb5CC1A9090CF15333CD85e792901AAEeF63bF52';

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

async function check() {
  console.log('Checking contract:', CONTRACT);
  
  // Try to call get_routes
  try {
    const routes = await client.readContract({
      address: CONTRACT,
      abi: [{
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
        outputs: [{ type: 'tuple[]', components: [
          { name: 'bridgeAdapter', type: 'address' },
          { name: 'bridgeName', type: 'string' },
          { name: 'estimatedTime', type: 'uint256' },
          { name: 'estimatedGasCost', type: 'uint256' },
          { name: 'bridgeFee', type: 'uint256' },
          { name: 'totalCostUSD', type: 'uint256' },
          { name: 'amountOut', type: 'uint256' },
          { name: 'available', type: 'bool' },
        ]}],
      }],
      functionName: 'get_routes',
      args: [421614n, 80002n, USDC, parseUnits('100', 6), '0xba05Ac1D2bD65eC83d8F5B708CB7B51B661A9d27'],
    });

    if (routes.length > 0) {
      console.log(`✅ SUCCESS! Contract is working - ${routes.length} routes found`);
      console.log('\nYour frontend should show routes now!');
    } else {
      console.log('⚠️  Contract initialized but no adapters configured');
      console.log('   Run: init-contract.bat');
    }
  } catch (error) {
    console.log('❌ Contract not working:', error.shortMessage || error.message);
    console.log('\nYou need to initialize the contract.');
    console.log('Run: init-contract.bat');
  }
}

check();



