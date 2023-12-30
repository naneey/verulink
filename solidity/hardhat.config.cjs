require("@nomicfoundation/hardhat-toolbox");
require("hardhat-contract-sizer");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
            details: { yul: false },
          }
        }
      }
    ]
  },
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq",
      accounts: [process.env.SECRET_KEY1]
    }
  },
  
  contractSizer: {
    alphaSort: true,
    runOnCompile: true
  }
};
