require('dotenv').config()

module.exports = {
  accounts: [process.env.ALEO_PRIVATE_KEY],
  mode: "execute",
  mainnet: {},
  networks: {
    testnet3: {
      endpoint: "https://api.explorer.aleo.org/v1",
      accounts: [process.env.ALEO_TESTNET_PRIVATE_KEY],
      priorityFee: 0.01,
    },
    mainnet: {
      endpoint: "https://api.explorer.aleo.org/v1",
      accounts: [process.env.ALEO_PRIVATE_KEY_MAINNET],
      priorityFee: 0.001,
    },
  },
  defaultNetwork: "testnet3",
};
