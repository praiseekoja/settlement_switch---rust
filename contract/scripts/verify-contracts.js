const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Verifying contracts on Etherscan...");
  
  const deploymentFile = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    console.error("Deployment file not found. Please deploy contracts first.");
    process.exit(1);
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));

  console.log("Network:", hre.network.name);
  console.log("Chain ID:", deployments.chainId);

  // Verify PriceOracle
  console.log("\n📝 Verifying PriceOracle...");
  try {
    await hre.run("verify:verify", {
      address: deployments.priceOracle,
      constructorArguments: [],
    });
    console.log("✅ PriceOracle verified");
  } catch (error) {
    console.log("⚠️ PriceOracle verification failed:", error.message);
  }

  // Verify StablecoinRouter
  console.log("\n📝 Verifying StablecoinRouter...");
  try {
    await hre.run("verify:verify", {
      address: deployments.router,
      constructorArguments: [deployments.priceOracle],
    });
    console.log("✅ StablecoinRouter verified");
  } catch (error) {
    console.log("⚠️ StablecoinRouter verification failed:", error.message);
  }

  // Verify Mock Tokens
  console.log("\n📝 Verifying Mock Tokens...");
  try {
    await hre.run("verify:verify", {
      address: deployments.mockUSDC,
      constructorArguments: [],
    });
    console.log("✅ MockUSDC verified");
  } catch (error) {
    console.log("⚠️ MockUSDC verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: deployments.mockUSDT,
      constructorArguments: [],
    });
    console.log("✅ MockUSDT verified");
  } catch (error) {
    console.log("⚠️ MockUSDT verification failed:", error.message);
  }

  // Verify Bridge Adapters
  console.log("\n📝 Verifying Bridge Adapters...");
  
  try {
    await hre.run("verify:verify", {
      address: deployments.hopBridge,
      constructorArguments: [],
    });
    console.log("✅ HopBridgeAdapter verified");
  } catch (error) {
    console.log("⚠️ HopBridgeAdapter verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: deployments.acrossBridge,
      constructorArguments: [],
    });
    console.log("✅ AcrossBridgeAdapter verified");
  } catch (error) {
    console.log("⚠️ AcrossBridgeAdapter verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: deployments.stargateBridge,
      constructorArguments: [],
    });
    console.log("✅ StargateAdapter verified");
  } catch (error) {
    console.log("⚠️ StargateAdapter verification failed:", error.message);
  }

  console.log("\n✅ Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });



