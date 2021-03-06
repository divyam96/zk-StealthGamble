require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");

// Replace this private key with your Harmony account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Be aware of NEVER putting real Ether into testing accounts
const HARMONY_PRIVATE_KEY = "";

module.exports = {
    solidity: {
        version: "0.8.4",
        optimizer: {
            enabled: true,
            runs: 200
        }
    },
    networks: {
        hardhat: {
            gas: 100000000,
            blockGasLimit: 0x1fffffffffffff
        },
        devnet: {
            url: "https://api.s0.ps.hmny.io",
            chainId: 1666900000,
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        },
        mainnet: {
            url: "https://api.harmony.one",
            chainId: 1666600000,
            accounts: [`${HARMONY_PRIVATE_KEY}`]
        },
    },
    namedAccounts: {
        deployer: 0,
    },
    paths: {
        deploy_devnet: "deploy_devnet",
        deploy_mainnet: "deploy_mainnet",
        deployments: "deployments",
    },
    mocha: {
        timeout: 1000000
    }
};
