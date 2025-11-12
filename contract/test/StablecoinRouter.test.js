const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StablecoinRouter", function () {
  let router, priceOracle, mockUSDC, mockUSDT;
  let hopBridge, acrossBridge, stargateBridge;
  let owner, user1, user2;

  const ARBITRUM_SEPOLIA = 421614;
  const POLYGON_AMOY = 80002;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Mock Tokens
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.waitForDeployment();

    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
    await mockUSDT.waitForDeployment();

    // Deploy Price Oracle
    const PriceOracle = await ethers.getContractFactory("PriceOracle");
    priceOracle = await PriceOracle.deploy();
    await priceOracle.waitForDeployment();

    // Deploy StablecoinRouter
    const StablecoinRouter = await ethers.getContractFactory("StablecoinRouter");
    router = await StablecoinRouter.deploy(await priceOracle.getAddress());
    await router.waitForDeployment();

    // Deploy Bridge Adapters
    const HopBridge = await ethers.getContractFactory("HopBridgeAdapter");
    hopBridge = await HopBridge.deploy();
    await hopBridge.waitForDeployment();

    const AcrossBridge = await ethers.getContractFactory("AcrossBridgeAdapter");
    acrossBridge = await AcrossBridge.deploy();
    await acrossBridge.waitForDeployment();

    const StargateBridge = await ethers.getContractFactory("StargateAdapter");
    stargateBridge = await StargateBridge.deploy();
    await stargateBridge.waitForDeployment();

    // Setup gas prices
    await priceOracle.setGasPrice(ARBITRUM_SEPOLIA, ethers.parseUnits("0.1", "gwei"));
    await priceOracle.setGasPrice(POLYGON_AMOY, ethers.parseUnits("30", "gwei"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await router.owner()).to.equal(owner.address);
    });

    it("Should set the price oracle", async function () {
      expect(await router.priceOracle()).to.equal(await priceOracle.getAddress());
    });

    it("Should initialize with zero transfers", async function () {
      const stats = await router.getStatistics();
      expect(stats[0]).to.equal(0); // totalTransfers
      expect(stats[1]).to.equal(0); // totalVolumeUSD
    });
  });

  describe("Bridge Adapter Management", function () {
    it("Should add bridge adapter", async function () {
      await router.addBridgeAdapter(await hopBridge.getAddress());
      
      const adapters = await router.getBridgeAdapters();
      expect(adapters.length).to.equal(1);
      expect(adapters[0]).to.equal(await hopBridge.getAddress());
    });

    it("Should remove bridge adapter", async function () {
      const hopAddress = await hopBridge.getAddress();
      await router.addBridgeAdapter(hopAddress);
      await router.removeBridgeAdapter(hopAddress);
      
      const adapters = await router.getBridgeAdapters();
      expect(adapters.length).to.equal(0);
    });

    it("Should not add duplicate bridge adapter", async function () {
      const hopAddress = await hopBridge.getAddress();
      await router.addBridgeAdapter(hopAddress);
      
      await expect(
        router.addBridgeAdapter(hopAddress)
      ).to.be.revertedWith("Adapter already exists");
    });

    it("Should not add zero address as adapter", async function () {
      await expect(
        router.addBridgeAdapter(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid adapter address");
    });
  });

  describe("Token Management", function () {
    it("Should add token support", async function () {
      const usdcAddress = await mockUSDC.getAddress();
      await router.setTokenSupport(usdcAddress, true);
      
      expect(await router.supportedTokens(usdcAddress)).to.be.true;
      
      const tokens = await router.getSupportedTokens();
      expect(tokens.length).to.equal(1);
      expect(tokens[0]).to.equal(usdcAddress);
    });

    it("Should remove token support", async function () {
      const usdcAddress = await mockUSDC.getAddress();
      await router.setTokenSupport(usdcAddress, true);
      await router.setTokenSupport(usdcAddress, false);
      
      expect(await router.supportedTokens(usdcAddress)).to.be.false;
      
      const tokens = await router.getSupportedTokens();
      expect(tokens.length).to.equal(0);
    });
  });

  describe("Route Finding", function () {
    beforeEach(async function () {
      // Setup bridges
      await router.addBridgeAdapter(await hopBridge.getAddress());
      await router.addBridgeAdapter(await acrossBridge.getAddress());
      await router.addBridgeAdapter(await stargateBridge.getAddress());

      // Setup tokens
      const usdcAddress = await mockUSDC.getAddress();
      await router.setTokenSupport(usdcAddress, true);

      // Configure bridge adapters
      await hopBridge.setTokenSupport(ARBITRUM_SEPOLIA, usdcAddress, true);
      await hopBridge.setTokenSupport(POLYGON_AMOY, usdcAddress, true);
      
      await acrossBridge.setTokenSupport(ARBITRUM_SEPOLIA, usdcAddress, true);
      await acrossBridge.setTokenSupport(POLYGON_AMOY, usdcAddress, true);
      
      await stargateBridge.setTokenSupport(ARBITRUM_SEPOLIA, usdcAddress, true);
      await stargateBridge.setTokenSupport(POLYGON_AMOY, usdcAddress, true);
    });

    it("Should get multiple routes", async function () {
      const request = {
        fromChain: ARBITRUM_SEPOLIA,
        toChain: POLYGON_AMOY,
        token: await mockUSDC.getAddress(),
        amount: ethers.parseUnits("100", 6),
        recipient: user1.address
      };

      const routes = await router.getRoutes(request);
      expect(routes.length).to.be.greaterThan(0);
    });

    it("Should get best route (cheapest)", async function () {
      const request = {
        fromChain: ARBITRUM_SEPOLIA,
        toChain: POLYGON_AMOY,
        token: await mockUSDC.getAddress(),
        amount: ethers.parseUnits("100", 6),
        recipient: user1.address
      };

      const bestRoute = await router.getBestRoute(request);
      expect(bestRoute.available).to.be.true;
      expect(bestRoute.bridgeName).to.not.be.empty;
    });

    it("Should sort routes by cost", async function () {
      const request = {
        fromChain: ARBITRUM_SEPOLIA,
        toChain: POLYGON_AMOY,
        token: await mockUSDC.getAddress(),
        amount: ethers.parseUnits("100", 6),
        recipient: user1.address
      };

      const routes = await router.getRoutes(request);
      
      // Check that routes are sorted by totalCostUSD
      for (let i = 0; i < routes.length - 1; i++) {
        expect(routes[i].totalCostUSD).to.be.lessThanOrEqual(routes[i + 1].totalCostUSD);
      }
    });
  });

  describe("Bridge Execution", function () {
    beforeEach(async function () {
      // Setup system
      await router.addBridgeAdapter(await hopBridge.getAddress());
      const usdcAddress = await mockUSDC.getAddress();
      await router.setTokenSupport(usdcAddress, true);

      await hopBridge.setTokenSupport(ARBITRUM_SEPOLIA, usdcAddress, true);
      await hopBridge.setTokenSupport(POLYGON_AMOY, usdcAddress, true);

      // Give user tokens
      await mockUSDC.connect(user1).faucet();
    });

    it("Should execute bridge with specific adapter", async function () {
      const amount = ethers.parseUnits("100", 6);
      const usdcAddress = await mockUSDC.getAddress();
      
      // Approve router
      await mockUSDC.connect(user1).approve(await router.getAddress(), amount);

      // Execute bridge
      await expect(
        router.connect(user1).executeWithBridge(
          await hopBridge.getAddress(),
          POLYGON_AMOY,
          usdcAddress,
          amount,
          user1.address
        )
      ).to.emit(router, "CrossChainTransferInitiated");
    });

    it("Should not execute with unsupported token", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await expect(
        router.connect(user1).executeWithBridge(
          await hopBridge.getAddress(),
          POLYGON_AMOY,
          await mockUSDT.getAddress(), // Not supported
          amount,
          user1.address
        )
      ).to.be.revertedWith("Token not supported");
    });

    it("Should not execute with invalid bridge", async function () {
      const amount = ethers.parseUnits("100", 6);
      
      await expect(
        router.connect(user1).executeWithBridge(
          user2.address, // Not a bridge
          POLYGON_AMOY,
          await mockUSDC.getAddress(),
          amount,
          user1.address
        )
      ).to.be.revertedWith("Invalid bridge adapter");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add bridge", async function () {
      await expect(
        router.connect(user1).addBridgeAdapter(await hopBridge.getAddress())
      ).to.be.reverted;
    });

    it("Should only allow owner to update price oracle", async function () {
      await expect(
        router.connect(user1).updatePriceOracle(await priceOracle.getAddress())
      ).to.be.reverted;
    });

    it("Should only allow owner to set token support", async function () {
      await expect(
        router.connect(user1).setTokenSupport(await mockUSDC.getAddress(), true)
      ).to.be.reverted;
    });
  });
});



