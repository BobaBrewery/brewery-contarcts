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
            gasPrice: 350000000000,
            gas: 2100000,
            chainId: 288,
            timeout: 900000000,
            accounts: [process.env.PK],
        },
        boba_rinkeby: {
            url: 'https://rinkeby.boba.network',
            gas: 10000000,
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

