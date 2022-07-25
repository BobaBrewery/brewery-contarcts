const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const USDTHolder = "0x24e1Ae757ca647101B0e7614217b7AE26338F578";
    const USDT = "0x55d398326f99059fF775485246999027B3197955";
    const Move2Earn = "0xE9c41103649B047fAaAc059b575827A03D8e6A67";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);

    const Minter = await hre.ethers.getContractFactory("MoveRefund");
    console.log('start deploy refunder...');
    // nft holder : alice
    const minter = await Minter.deploy(Admin.address, Move2Earn, USDT, USDTHolder);
    await minter.deployed();
    console.log("Refunder deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "MoveRefund", minter.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
