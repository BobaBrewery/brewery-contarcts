const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


const USDT_HOLDER_ADDR = "0x24e1Ae757ca647101B0e7614217b7AE26338F578"
const NFT_RECIPIENT_ADDR = "0x7291030263771b40731D6Bc6b352358D23F5737F"
const ROLE_NFT = "0x10fdE59432D1d6eE7aD25448e3D8B9b3D2c08b89"
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955"

async function main() {

    const Refund = await hre.ethers.getContractFactory("CyberpopRefund");
    console.log('start deploy Refund...');
    const refund = await Refund.deploy(ROLE_NFT, BSC_USDT, USDT_HOLDER_ADDR, NFT_RECIPIENT_ADDR);
    await refund.deployed();
    console.log("Minter deployed to: ", refund.address);
    saveContractAddress(hre.network.name, "CyberpopRefund", refund.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
