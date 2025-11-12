const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.config.chainId);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const deployments = {};

  // 1. Deploy Mock Tokens
  console.log("\n📝 Deploying Mock Tokens...");
  
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  const usdcAddress = await mockUSDC.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);
  deployments.mockUSDC = usdcAddress;

  const MockUSDT = await hre.ethers.getContractFactory("MockUSDT");
  const mockUSDT = await MockUSDT.deploy();
  await mockUSDT.waitForDeployment();
  const usdtAddress = await mockUSDT.getAddress();
  console.log("✅ MockUSDT deployed to:", usdtAddress);
  deployments.mockUSDT = usdtAddress;

  // 2. Deploy Price Oracle
  console.log("\n💰 Deploying Price Oracle...");
  const PriceOracle = await hre.ethers.getContractFactory("PriceOracle");
  const priceOracle = await PriceOracle.deploy();
  await priceOracle.waitForDeployment();
  const priceOracleAddress = await priceOracle.getAddress();
  console.log("✅ PriceOracle deployed to:", priceOracleAddress);
  deployments.priceOracle = priceOracleAddress;

  // 3. Deploy StablecoinRouter
  console.log("\n🌉 Deploying StablecoinRouter...");
  const StablecoinRouter = await hre.ethers.getContractFactory("StablecoinRouter");
  const router = await StablecoinRouter.deploy(priceOracleAddress);
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("✅ StablecoinRouter deployed to:", routerAddress);
  deployments.router = routerAddress;

  // 4. Deploy Bridge Adapters
  console.log("\n🌁 Deploying Bridge Adapters...");
  
  const HopBridge = await hre.ethers.getContractFactory("HopBridgeAdapter");
  const hopBridge = await HopBridge.deploy();
  await hopBridge.waitForDeployment();
  const hopAddress = await hopBridge.getAddress();
  console.log("✅ HopBridgeAdapter deployed to:", hopAddress);
  deployments.hopBridge = hopAddress;

  const AcrossBridge = await hre.ethers.getContractFactory("AcrossBridgeAdapter");
  const acrossBridge = await AcrossBridge.deploy();
  await acrossBridge.waitForDeployment();
  const acrossAddress = await acrossBridge.getAddress();
  console.log("✅ AcrossBridgeAdapter deployed to:", acrossAddress);
  deployments.acrossBridge = acrossAddress;

  const StargateBridge = await hre.ethers.getContractFactory("StargateAdapter");
  const stargateBridge = await StargateBridge.deploy();
  await stargateBridge.waitForDeployment();
  const stargateAddress = await stargateBridge.getAddress();
  console.log("✅ StargateAdapter deployed to:", stargateAddress);
  deployments.stargateBridge = stargateAddress;

  // 5. Configure the system
  console.log("\n⚙️ Configuring the system...");

  // Add bridge adapters to router
  console.log("Adding bridge adapters to router...");
  await router.addBridgeAdapter(hopAddress);
  console.log("✅ Hop Bridge added");
  
  await router.addBridgeAdapter(acrossAddress);
  console.log("✅ Across Bridge added");
  
  await router.addBridgeAdapter(stargateAddress);
  console.log("✅ Stargate Bridge added");

  // Add token support to router
  console.log("Adding token support to router...");
  await router.setTokenSupport(usdcAddress, true);
  console.log("✅ USDC support added");
  
  await router.setTokenSupport(usdtAddress, true);
  console.log("✅ USDT support added");

  // Configure bridge adapters with supported tokens
  const chainId = hre.network.config.chainId;
  const otherChainId = chainId === 421614 ? 80002 : 421614; // Arbitrum Sepolia or Polygon Amoy

  console.log(`Configuring bridges for chain ${chainId} and ${otherChainId}...`);

  // Configure Hop Bridge
  await hopBridge.setTokenSupport(chainId, usdcAddress, true);
  await hopBridge.setTokenSupport(chainId, usdtAddress, true);
  await hopBridge.setTokenSupport(otherChainId, usdcAddress, true);
  await hopBridge.setTokenSupport(otherChainId, usdtAddress, true);
  console.log("✅ Hop Bridge configured");

  // Configure Across Bridge
  await acrossBridge.setTokenSupport(chainId, usdcAddress, true);
  await acrossBridge.setTokenSupport(chainId, usdtAddress, true);
  await acrossBridge.setTokenSupport(otherChainId, usdcAddress, true);
  await acrossBridge.setTokenSupport(otherChainId, usdtAddress, true);
  console.log("✅ Across Bridge configured");

  // Configure Stargate Bridge
  await stargateBridge.setTokenSupport(chainId, usdcAddress, true);
  await stargateBridge.setTokenSupport(chainId, usdtAddress, true);
  await stargateBridge.setTokenSupport(otherChainId, usdcAddress, true);
  await stargateBridge.setTokenSupport(otherChainId, usdtAddress, true);
  console.log("✅ Stargate Bridge configured");

  // Set gas prices for testnets (example values in wei)
  // Arbitrum Sepolia: ~0.1 gwei, Polygon Amoy: ~30 gwei
  const gasPriceArbitrum = hre.ethers.parseUnits("0.1", "gwei");
  const gasPricePolygon = hre.ethers.parseUnits("30", "gwei");

  await priceOracle.setGasPrice(421614, gasPriceArbitrum); // Arbitrum Sepolia
  await priceOracle.setGasPrice(80002, gasPricePolygon); // Polygon Amoy
  console.log("✅ Gas prices configured");

  // 6. Save deployment information
  console.log("\n💾 Saving deployment information...");
  
  deployments.network = hre.network.name;
  deployments.chainId = chainId;
  deployments.deployer = deployer.address;
  deployments.timestamp = new Date().toISOString();

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deployments, null, 2));
  console.log("✅ Deployment info saved to:", deploymentFile);

  // 7. Summary
  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Deployed Contracts:");
  console.log("  Router:", routerAddress);
  console.log("  Price Oracle:", priceOracleAddress);
  console.log("  Mock USDC:", usdcAddress);
  console.log("  Mock USDT:", usdtAddress);
  console.log("  Hop Bridge:", hopAddress);
  console.log("  Across Bridge:", acrossAddress);
  console.log("  Stargate Bridge:", stargateAddress);
  console.log("\n🔗 Network:", hre.network.name);
  console.log("⛓️  Chain ID:", chainId);
  console.log("👤 Deployer:", deployer.address);
  console.log("\n" + "=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



