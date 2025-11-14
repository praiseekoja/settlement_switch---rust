#!/bin/bash

CONTRACT_ADDRESS="0x443ec868aafd6eba80d124a8cb4345cc827e7ee1"
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: PRIVATE_KEY environment variable is not set!"
    echo ""
    echo "Please set it first:"
    echo "  export PRIVATE_KEY=0xYourPrivateKeyHere"
    echo ""
    echo "Or run commands manually with:"
    echo "  cast send ... --private-key 0xYourPrivateKey"
    exit 1
fi

echo "🚀 Initializing Settlement Switch Contract..."
echo "Contract: $CONTRACT_ADDRESS"
echo ""

# 1. Initialize
echo "1️⃣ Initializing contract with price oracle..."
cast send $CONTRACT_ADDRESS \
  "initialize(address)" \
  0x283a192277871721Cdc57736687703902B6D4EDB \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Initialization complete!"
else
    echo ""
    echo "❌ Initialization failed!"
    exit 1
fi

echo ""

# 2. Add Stargate
echo "2️⃣ Adding Stargate bridge adapter..."
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address,string)" \
  0x45A01E4e04F14f7A4a6702c74187c5F6222033cd \
  "Stargate" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Stargate adapter added!"
else
    echo ""
    echo "❌ Failed to add Stargate adapter!"
fi

echo ""

# 3. Add Hop
echo "3️⃣ Adding Hop Protocol bridge adapter..."
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address,string)" \
  0x0e0E3d2C5c292161999474247956EF542caBF8dd \
  "Hop Protocol" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Hop Protocol adapter added!"
else
    echo ""
    echo "❌ Failed to add Hop adapter!"
fi

echo ""

# 4. Add Across
echo "4️⃣ Adding Across Protocol bridge adapter..."
cast send $CONTRACT_ADDRESS \
  "addBridgeAdapter(address,string)" \
  0x13fDac9F9b4777705db45291bbFF3c972c6d1d97 \
  "Across Protocol" \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Across Protocol adapter added!"
else
    echo ""
    echo "❌ Failed to add Across adapter!"
fi

echo ""
echo "🎉 Contract setup complete!"
echo ""
echo "📊 Verify on Arbiscan:"
echo "https://sepolia.arbiscan.io/address/$CONTRACT_ADDRESS"
