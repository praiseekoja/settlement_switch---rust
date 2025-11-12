# Load .env file
if (!(Test-Path .env)) {
    Write-Error "Error: .env file not found!"
    Write-Host "Please create .env file with PRIVATE_KEY and ARBITRUM_SEPOLIA_RPC_URL"
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^(.+?)=(.+)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
    }
}

# Check required variables
if (!$env:PRIVATE_KEY) {
    Write-Error "Error: PRIVATE_KEY not set in .env"
    exit 1
}

if (!$env:ARBITRUM_SEPOLIA_RPC_URL) {
    Write-Error "Error: ARBITRUM_SEPOLIA_RPC_URL not set in .env"
    exit 1
}

Write-Host "Deploying contracts to Arbitrum Sepolia..."

# Check the contract first
Write-Host "Checking contract..."
cargo stylus check

if ($LASTEXITCODE -ne 0) {
    Write-Error "Contract check failed!"
    exit 1
}

# Deploy the contract
Write-Host "Deploying contract..."
cargo stylus deploy --private-key $env:PRIVATE_KEY --rpc-url $env:ARBITRUM_SEPOLIA_RPC_URL

if ($LASTEXITCODE -ne 0) {
    Write-Error "Deployment failed!"
    exit 1
}

Write-Host "Deployment successful!"