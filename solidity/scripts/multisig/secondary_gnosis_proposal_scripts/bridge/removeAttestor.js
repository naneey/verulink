import hardhat from 'hardhat';
const { ethers } = hardhat;
import Safe from "@safe-global/protocol-kit";
import { EthersAdapter } from "@safe-global/protocol-kit";
import SafeApiKit from "@safe-global/api-kit";
import * as dotenv from "dotenv";
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  "https://rpc2.sepolia.org"
);
console.log("ethers version = ", ethers.version);

async function removeAttestor(signer) {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });

  const safeService = new SafeApiKit.default({
    txServiceUrl: "https://safe-transaction-sepolia.safe.global",
    ethAdapter,
  });

  const attestor = "0x684C68bE1b58f61a33888E0eE3EA63f021d8CB0a";
  const newQuorumRequired = 1;
  const ERC20TokenbridgeImpl = await ethers.getContractFactory("Bridge", {
    libraries: {
      PacketLibrary: process.env.PACKET_LIBRARY_CONTRACT_ADDRESS,
      AleoAddressLibrary: process.env.AleoAddressLibrary,
    },
  });
  // console.log("ERC20TokenbridgeImpl = ", ERC20TokenbridgeImpl);
  const tokenbridgeProxyAddress = process.env.TOKENBRIDGEPROXY_ADDRESS;
  const iface = new ethers.utils.Interface(ERC20TokenbridgeImpl.interface.format());
  const calldata = iface.encodeFunctionData("removeAttestor", [attestor, newQuorumRequired]);
  const safeSdk = await Safe.default.create({
    ethAdapter: ethAdapter,
    safeAddress: process.env.SAFE_ADDRESS,
  });

  const txData = {
    to: tokenbridgeProxyAddress,
    value: "0",
    data: calldata,
  };

  const safeTx = await safeSdk.createTransaction({
    safeTransactionData: txData,
  });
  const safeTxHash = await safeSdk.getTransactionHash(safeTx);

  console.log("txn hash", safeTxHash);
  const signature = await safeSdk.signTypedData(safeTx);

  const transactionConfig = {
    safeAddress: process.env.SAFE_ADDRESS,
    safeTransactionData: safeTx.data,
    safeTxHash: safeTxHash,
    senderAddress: process.env.SENDER_ADDRESS,
    senderSignature: signature.data,
  };

  await safeService.proposeTransaction(transactionConfig);
}

removeAttestor(
  new ethers.Wallet(process.env.SECRET_KEY1, provider)
);