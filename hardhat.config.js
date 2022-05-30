require('dotenv').config();
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-ethers')
require("@nomiclabs/hardhat-web3")
require('@openzeppelin/hardhat-upgrades')
require('solidity-coverage');
require("dotenv").config()


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    networks: {
        ethereum: {
            url: 'https://mainnet.infura.io/v3/eaa5fb64cc5d4f43aa01d12ead1602f3',
            accounts: [process.env.PK],
        },
        rinkeby: {
            url: 'https://rinkeby.infura.io/v3/3d0da1b673d249078956653f2d65bd75',
            gas: 2100000,
            gasPrice: 100000000000,
            accounts: [process.env.PK],
        },
        boba_mainnet: {
            url: 'https://mainnet.boba.network/',
            chainId: 288,
            accounts: [process.env.PK],
        },
        boba_rinkeby: {
            url: 'https://rinkeby.boba.network',
            gas: 21000000,
            gasPrice: 1000000000,
            accounts: [process.env.PK],
        },
        bsc_mainnet: {
            url: 'https://bsc-dataseed.binance.org',
            chainId: 56,
            accounts: [process.env.PK],
        },
        bsc_testnet: {
            url: 'https://data-seed-prebsc-2-s3.binance.org:8545/',
            gas: 21000000,
            chainId: 97,
            accounts: [process.env.PK],
        },
        fuji: {
            url: 'https://api.avax-test.network/ext/bc/C/rpc',
            gasPrice: 225000000000,
            chainId: 43113,
            accounts: [process.env.PK]
        },
        avax_mainnet: {
            url: 'https://api.avax.network/ext/bc/C/rpc',
            gasPrice: 50000000000,
            chainId: 43114,
            timeout: 900000000,
            accounts: [process.env.PK]
        },
        local: {
            url: 'http://localhost:8545',
        },
    },
    solidity: {
        version: "0.6.12",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
};

