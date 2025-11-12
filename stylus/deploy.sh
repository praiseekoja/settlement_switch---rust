#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file with PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC_URL"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$ARBITRUM_SEPOLIA_RPC_URL" ]; then
    echo "Error: ARBITRUM_SEPOLIA_RPC_URL not set in .env"
    exit 1
fi

echo "Deploying contracts to Arbitrum Sepolia..."

# Check the contract first
echo "Checking contract..."
cargo stylus check

if [ $? -ne 0 ]; then
    echo "Contract check failed!"
    exit 1
fi

# Deploy the contract
echo "Deploying contract..."
cargo stylus deploy --private-key $PRIVATE_KEY --rpc-url $ARBITRUM_SEPOLIA_RPC_URL

if [ $? -ne 0 ]; then
    echo "Deployment failed!"
    exit 1
fi

echo "Deployment successful!"