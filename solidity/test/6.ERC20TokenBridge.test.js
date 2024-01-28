import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
// console.log("ethers = ", ethers);
describe('ERC20TokenBridge', () => {
    let ERC20TokenbridgeImpl;
    let Proxy;
    let bridgeImpl;
    let lib;
    let owner;
    let signer;
    let attestor1;
    let attestor2;
    let initializeData;
    let proxiedV1;
    let tokenService;
    let other;
    let destChainId;
    let libInstance;
    let unknownAttestor;
    let unknowndestChainId;
    let unknowntokenService;

    function inPacketHash(inPacket) {
        let packetHash = ethers.utils.solidityKeccak256([
            "uint256",
            "uint256",
            "uint256", "string",
            "uint256", "address",
            "string", "address", "uint256", "address",
            "uint256"
        ], [
            inPacket[0],
            inPacket[1],
            inPacket[2][0], inPacket[2][1],
            inPacket[3][0], inPacket[3][1],
            inPacket[4][0], inPacket[4][1], inPacket[4][2], inPacket[4][3],
            inPacket[5]
        ]);
        // console.log("packet hash = ", packetHash);
        return packetHash;
    }

    beforeEach(async () => {
        [owner, attestor1, attestor2, signer, unknownAttestor, tokenService, unknowntokenService, other] = await ethers.getSigners();
        // [owner] = await ethers.getSigners();

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        libInstance = await lib.deploy();
        await libInstance.deployed();
        destChainId = 2;

        ERC20TokenbridgeImpl = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.address,
            },
        });

        bridgeImpl = await ERC20TokenbridgeImpl.deploy();
        await bridgeImpl.deployed();

        Proxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(ERC20TokenbridgeImpl.interface.format()).encodeFunctionData("initialize(address,uint256)", [owner.address, destChainId]);
        const proxy = await Proxy.deploy(bridgeImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = ERC20TokenbridgeImpl.attach(proxy.address);
        await (await proxiedV1.addAttestor(attestor1.address, 2)).wait();
        await (await proxiedV1.addAttestor(attestor2.address, 2)).wait();
        await (await proxiedV1.addTokenService(tokenService.address)).wait();
    });

    it('should have the correct owner and destinationChainId after initialization', async () => {
        const actualOwner = await proxiedV1.connect(owner).owner();
        expect(actualOwner).to.equal(owner.address);
        expect(await proxiedV1.isSupportedChain(destChainId)).to.be.true;
    });

    it('reverts if the contract is already initialized', async function () {
        expect(proxiedV1["initialize(address,uint256)"](owner.address, destChainId)).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should check if a chain is supported', async () => {
        const supportedChain = await proxiedV1.isSupportedChain(destChainId); // Initialized contract with destination chainId 2
        const unsupportedChain = await proxiedV1.isSupportedChain(3); // Assuming destination chainId is not 3

        expect(supportedChain).to.be.true;
        expect(unsupportedChain).to.be.false;
    });

    it('should revert on checking if a chain is supported by any contract other than proxy', async () => {
        expect(bridgeImpl.isSupportedChain(destChainId)).to.be.reverted; // Initialized contract with destination chainId 2
    });

    it('should update destinationChainId by the owner', async () => {
        const newDestChainId = 3; // Assuming a new destination chainId
        await proxiedV1.updateDestinationChainId(newDestChainId);

        const updatedDestChainId = await proxiedV1.destinationChainId();
        expect(updatedDestChainId).to.equal(newDestChainId);
    });

    it('should revert on updating destinationChainId by anyone other than owner', async () => {
        const newDestChainId = 3; // Assuming a new destination chainId
        expect(proxiedV1.connect(other).updateDestinationChainId(newDestChainId)).to.be.revertedWith("Not owner");

        const updatedDestChainId = await proxiedV1.destinationChainId();
        expect(updatedDestChainId).to.equal(destChainId);
    });

    it('should update destinationChainId only through proxy', async () => {
        const newDestChainId = 3; // Assuming a new destination chainId
        await proxiedV1.updateDestinationChainId(newDestChainId);

        const updatedDestChainId = await proxiedV1.destinationChainId();
        expect(updatedDestChainId).to.equal(newDestChainId);
    });

    it('should revert on updating destinationChainId by any contract other than proxy', async () => {
        const newDestChainId = 3; // Assuming a new destination chainId
        expect(bridgeImpl.updateDestinationChainId(newDestChainId)).to.be.reverted;

        const updatedDestChainId = await proxiedV1.destinationChainId();
        expect(updatedDestChainId).to.equal(destChainId);
    });

    it('should revert when updating to an already supported chain', async () => {
        const supportedChain = 2; // Already supported destination chainId is 2
        expect(proxiedV1.updateDestinationChainId(supportedChain)).to.be.revertedWith(
            'Destination Chain already supported'
        );
    });

    it('only allow a registered token service to call the consume', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor2.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        await proxiedV1.connect(tokenService).consume(inPacket, signatures);
    });

    it('should revert on consuming an incoming packet with an unknown token service', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        // const signature = await owner.signMessage(ethers.utils.arrayify(message));
        const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor2.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        expect(proxiedV1.connect(unknowntokenService).consume(inPacket, signatures)).to.be.revertedWith("Unknown Token Service");
    });

    // it('should revert on consuming an incoming packet when signature length is not 65', async () => {
    //     // Create an inPacket
    //     const inPacket = [
    //         1,
    //         1,
    //         [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
    //         [1, ethers.Wallet.createRandom().address],
    //         ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
    //         100
    //     ];
    //     const packetHash = inPacketHash(inPacket);
    //     let message = ethers.utils.solidityKeccak256(
    //         ['bytes32', 'uint8'],
    //         [packetHash, 1]
    //     );
    //     // const signature = await owner.signMessage(ethers.utils.arrayify(message));
    //     const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
    //     const signature2 = await attestor2.signMessage(ethers.utils.arrayify(message));
    //     const signatures = [signature1 + "abc", signature2];
    //     expect(proxiedV1.connect(tokenService).consume(inPacket, signatures)).to.be.reverted;
    // });

    it('should revert on consuming an incoming packet through any contract other than proxy', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        // const signature = await owner.signMessage(ethers.utils.arrayify(message));
        const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor2.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        expect(bridgeImpl.connect(tokenService).consume(inPacket, signatures)).to.be.reverted;
    });

    it('should revert on consuming an incoming packet that is already consumed', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor2.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        await proxiedV1.connect(tokenService).consume(inPacket, signatures);
        expect(proxiedV1.connect(tokenService).consume(inPacket, signatures)).to.be.reverted;
    });

    it('should dispatch an outgoing packet when sendMessage is called', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        await proxiedV1.connect(tokenService).sendMessage(outPacket);
    });

    it('should revert dispatching an outpacket when sendMessage is called through any contract other than proxy', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        expect(bridgeImpl.connect(tokenService).sendMessage(outPacket)).to.be.reverted;
    });

    it('should revert when calling sendMessage with unknown destination chainId', async () => {
        const unknowndestChainId = 3;
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [unknowndestChainId, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        expect(proxiedV1.connect(tokenService).sendMessage(outPacket)).to.be.revertedWith("Unknown destination chainId");
    });

    it('should revert when calling sendMessage with unknown token service', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        expect(proxiedV1.connect(unknowntokenService).sendMessage(outPacket)).to.be.revertedWith("Unknown Token Service");
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: ERC20TokenBridgeV2', () => {
    let ERC20TokenBridgeV1Impl, initializeData, proxied, ERC20TokenBridgeV1, upgradeData;
    let lib;
    let owner;
    let signer;
    let other;
    let ERC20TokenBridgeV2Impl;
    let ERC20TokenBridgeV2;
    let ERC20TokenBridgeProxy;
    let tokenService;
    let destChainId;

    // Deploy a new HoldingV2 contract before each test
    beforeEach(async () => {
        [owner, tokenService, signer, other] = await ethers.getSigners();
        destChainId = 2;
        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();

        ERC20TokenBridgeV1 = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.address,
            },
        });

        ERC20TokenBridgeV1Impl = await ERC20TokenBridgeV1.deploy();
        await ERC20TokenBridgeV1Impl.deployed();
        let ERC20TokenBridgeABI = ERC20TokenBridgeV1.interface.format();

        ERC20TokenBridgeProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(ERC20TokenBridgeABI).encodeFunctionData("initialize(address,uint256)", [owner.address, destChainId]);
        const proxy = await ERC20TokenBridgeProxy.deploy(ERC20TokenBridgeV1Impl.address, initializeData);
        await proxy.deployed();
        proxied = ERC20TokenBridgeV1.attach(proxy.address);

        ERC20TokenBridgeV2 = await ethers.getContractFactory("ERC20TokenBridgeV2", {
            libraries: {
                PacketLibrary: libInstance.address,
            },
        });

        ERC20TokenBridgeV2Impl = await ERC20TokenBridgeV2.deploy();
        await ERC20TokenBridgeV2Impl.deployed();
        let ERC20TokenBridgeV2ABI = ERC20TokenBridgeV2.interface.format();

        upgradeData = new ethers.utils.Interface(ERC20TokenBridgeV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.upgradeToAndCall(ERC20TokenBridgeV2Impl.address, upgradeData);
        proxied = ERC20TokenBridgeV2.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should give the correct owner', async () => {
        const contractOwner = await proxied.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test the value set by the multiply function
    it('should set the correct value', async () => {
        const val = await proxied.val();
        expect(val).to.equal(5);
    });

    it('only owner should be able to upgrade', async () => {
        expect(proxied.connect(other).upgradeToAndCall(ERC20TokenBridgeV2Impl.address, upgradeData)).to.be.revertedWith("Only owner can upgrade");
    });

    it('reverts if the contract is initialized twice', async function () {
        expect(proxied.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });
});
