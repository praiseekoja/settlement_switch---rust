const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const chainlinkFeeds = require("../constants/chainlink-feeds");

async function main() {
  console.log("Setting up Price Oracle with Chainlink feeds...");
  
  const deploymentFile = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.error("Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const priceOracle = await hre.ethers.getContractAt("PriceOracle", deployments.priceOracle);

  console.log("Network:", hre.network.name);
  console.log("Price Oracle:", deployments.priceOracle);

  const chainId = hre.network.config.chainId;

  // Get Chainlink feeds for this network
  let feeds = {};
  if (chainId === 421614) {
    feeds = chainlinkFeeds.arbitrumSepolia;
  } else if (chainId === 80002) {
    feeds = chainlinkFeeds.polygonAmoy;
  }

  console.log("\n⚙️ Configuring price feeds...");

  // Set native token price feed if available
  if (feeds.ethUsd && chainId === 421614) {
    console.log("Setting ETH/USD price feed...");
    await priceOracle.setNativePriceFeed(chainId, feeds.ethUsd);
    console.log("✅ ETH/USD feed set");
  } else if (feeds.maticUsd && chainId === 80002) {
    console.log("Setting MATIC/USD price feed...");
    await priceOracle.setNativePriceFeed(chainId, feeds.maticUsd);
    console.log("✅ MATIC/USD feed set");
  } else {
    console.log("⚠️ No native token price feed available for this network");
    console.log("   Using manual gas price configuration instead");
  }

  // For tokens without Chainlink feeds, we'll use fallback prices
  // These are set as constants in the contract or can be updated by owner
  console.log("\n💰 Note: USDC/USDT price feeds not available on testnets");
  console.log("   Using $1.00 as the default price for stablecoins");

  console.log("\n✅ Oracle setup complete!");
  console.log("\n📋 Manual steps if needed:");
  console.log("   - Update gas prices using setGasPrice(chainId, price)");
  console.log("   - Add custom price feeds using setTokenPriceFeed(token, feed)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



