const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Loading deployment information...");
  
  const deploymentFile = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.error("Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const [user] = await hre.ethers.getSigners();

  console.log("\n🔍 Interacting with Settlement Switch");
  console.log("Network:", hre.network.name);
  console.log("User:", user.address);

  // Get contract instances
  const router = await hre.ethers.getContractAt("StablecoinRouter", deployments.router);
  const mockUSDC = await hre.ethers.getContractAt("MockUSDC", deployments.mockUSDC);

  // 1. Get tokens from faucet
  console.log("\n💰 Getting tokens from faucet...");
  const faucetTx = await mockUSDC.faucet();
  await faucetTx.wait();
  const balance = await mockUSDC.balanceOf(user.address);
  console.log("✅ Received USDC. Balance:", hre.ethers.formatUnits(balance, 6), "USDC");

  // 2. Get available routes
  console.log("\n🔍 Getting available routes...");
  const amount = hre.ethers.parseUnits("100", 6); // 100 USDC
  const toChain = hre.network.config.chainId === 421614 ? 80002 : 421614;

  const request = {
    fromChain: hre.network.config.chainId,
    toChain: toChain,
    token: deployments.mockUSDC,
    amount: amount,
    recipient: user.address
  };

  try {
    const routes = await router.getRoutes(request);
    console.log(`\n📊 Found ${routes.length} available routes:\n`);

    routes.forEach((route, index) => {
      console.log(`Route ${index + 1}: ${route.bridgeName}`);
      console.log(`  Estimated Time: ${route.estimatedTime} seconds`);
      console.log(`  Estimated Gas: ${route.estimatedGas} wei`);
      console.log(`  Bridge Fee: ${hre.ethers.formatUnits(route.bridgeFee, 6)} USDC`);
      console.log(`  Total Cost: $${hre.ethers.formatUnits(route.totalCostUSD, 8)}`);
      console.log(`  Amount Out: ${hre.ethers.formatUnits(route.amountOut, 6)} USDC`);
      console.log("");
    });
  } catch (error) {
    console.error("Error getting routes:", error.message);
  }

  // 3. Get best route
  console.log("\n🏆 Getting best route...");
  try {
    const bestRoute = await router.getBestRoute(request);
    console.log("Best Route:", bestRoute.bridgeName);
    console.log("  Total Cost: $" + hre.ethers.formatUnits(bestRoute.totalCostUSD, 8));
    console.log("  Amount Out: " + hre.ethers.formatUnits(bestRoute.amountOut, 6) + " USDC");
  } catch (error) {
    console.error("Error getting best route:", error.message);
  }

  // 4. Get statistics
  console.log("\n📈 Router Statistics:");
  const stats = await router.getStatistics();
  console.log("  Total Transfers:", stats[0].toString());
  console.log("  Total Volume: $" + hre.ethers.formatUnits(stats[1], 8));

  // 5. Get bridge adapters
  console.log("\n🌉 Available Bridge Adapters:");
  const adapters = await router.getBridgeAdapters();
  for (const adapter of adapters) {
    const bridge = await hre.ethers.getContractAt("MockBridgeAdapter", adapter);
    const info = await bridge.getBridgeInfo();
    console.log(`  - ${info[0]} (${adapter})`);
  }

  console.log("\n✅ Interaction complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



