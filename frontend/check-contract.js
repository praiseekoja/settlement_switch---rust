// Quick check of contract status
const { createPublicClient, http } = require('viem');
const { arbitrumSepolia } = require('viem/chains');

const CONTRACT_ADDRESS = '0x443ec868aafd6eba80d124a8cb4345cc827e7ee1';

const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
});

async function check() {
  console.log('Checking contract at:', CONTRACT_ADDRESS);
  
  // Check if contract exists
  const code = await client.getBytecode({ address: CONTRACT_ADDRESS });
  console.log('Contract deployed:', code ? 'YES' : 'NO');
  console.log('Code size:', code ? code.length : 0, 'bytes');
  
  if (!code) {
    console.log('\n❌ No contract found at this address!');
    return;
  }
  
  console.log('\n✅ Contract exists!');
  console.log('\nTry calling get_routes from the frontend.');
  console.log('If routes don\'t appear, the contract may need initialization.');
}

check().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

