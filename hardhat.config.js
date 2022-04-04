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
        mainnet: {
            url: 'https://mainnet.boba.network/',
            chainId: 288,
            accounts: [process.env.PK],
        },
        boba_rinkeby: {
            url: 'https://rinkeby.boba.network',
            gas: 5000000,
            gasPrice: 1000000000,
            accounts: [process.env.PK],
        },
        rinkeby: {
            url: 'https://eth-rinkeby.alchemyapi.io/v2/e3DsrbyScPv5XXuEeuvti7Li2vd6o6bm',
            gas: 21000000,
            accounts: [process.env.PK],
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

