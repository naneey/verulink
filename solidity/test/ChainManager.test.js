// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
import { ChainManagerABI } from "../scripts/ABI/ABI.js"

// Define the test suite
describe('ChainManager', () => {
    let owner, other, chainManagerImpl, ChainManager, ChainManagerProxy, initializeData, lib, proxiedV1;

    // Deploy a new ChainManager contract before each test
    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        ChainManager = await ethers.getContractFactory("ChainManager");
        chainManagerImpl = await ChainManager.deploy();
        ChainManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ChainManagerABI).encodeFunctionData("initialize", [owner.address]);
        const proxy = await ChainManagerProxy.deploy(chainManagerImpl.target, initializeData);
        proxiedV1 = ChainManager.attach(proxy.target);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding a chain
    it('should add a chain', async () => {
        const chainId = 1;
        const destBridgeAddress = "aleo.bridge";
        // Add chain
        await proxiedV1.addChain(chainId, destBridgeAddress);
        // Check if the chain was added
        const isSupported = await proxiedV1.isSupportedChain(chainId);
        expect(isSupported).to.be.true;
    });

    // Test attempting to add an existing chain
    it('should revert when trying to add an existing chain', async () => {
        const chainId = 1;
        const destBridgeAddress = "aleo.bridge";
        // Add a chain
        await proxiedV1.addChain(chainId, destBridgeAddress);
        // Attempt to add the same chain again
        await expect(proxiedV1.addChain(chainId, destBridgeAddress)).to.be.revertedWith('Chain already supported');
    });

    it('should revert when a non-owner tries to add a chain', async () => {
        const chainId = 1;
        const destBridgeAddress = "aleo.bridge";

        // Call addChain as a non-owner
        await expect(proxiedV1.connect(other).addChain(chainId, destBridgeAddress)).to.be.reverted;
    });

    // Test removing a chain
    it('should remove a chain', async () => {
        const chainId = 1;
        const destBridgeAddress = "aleo.bridge";
        // Add chain
        await proxiedV1.addChain(chainId, destBridgeAddress);
        // Remove chain
        await proxiedV1.removeChain(chainId);
        // Check if the chain was removed
        const isSupported = await proxiedV1.isSupportedChain(chainId);
        expect(isSupported).to.be.false;
    });

    // Test attempting to remove a non-existing chain
    it('should revert when trying to remove a non-existing chain', async () => {
        const nonExistingChainId = 99;
        // Attempt to remove a non-existing chain
        await expect(proxiedV1.removeChain(nonExistingChainId)).to.be.revertedWith('Unknown chainId');
    });

    it('should revert when a non-owner tries to remove a chain', async () => {
        const chainId = 1;
        const destBridgeAddress = "aleo.bridge";

        // Add chain first
        await proxiedV1.addChain(chainId, destBridgeAddress);

        // Call removeChain as a non-owner
        await expect(proxiedV1.connect(other).removeChain(chainId)).to.be.reverted;
    });

    it('should emit ChainAdded event when adding a new chain', async () => {
        const newChainId = 123;
        const destBridgeAddress = "aleo.bridge";
        const params = [newChainId, destBridgeAddress];
        const addChainTx = await proxiedV1.addChain(newChainId, destBridgeAddress);
        // Check event emission
        await expect(addChainTx)
            .to.emit(proxiedV1, 'ChainAdded')
            .withArgs(params);
    });

    it('should emit ChainRemoved event when removing an existing chain', async () => {
        const existingChainId = 11155111;
        // Add chain first
        await proxiedV1.addChain(existingChainId, "aleo.bridge");
        const removeChainTx = await proxiedV1.removeChain(existingChainId);
        // Check event emission
        await expect(removeChainTx)
            .to.emit(proxiedV1, 'ChainRemoved')
            .withArgs(existingChainId);
    });
});
