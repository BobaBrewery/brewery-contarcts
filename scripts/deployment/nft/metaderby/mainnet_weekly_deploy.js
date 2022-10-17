const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    // const USDT = "0x9eBBEB7f6b842377714EAdD987CaA4510205107A";
    const USDT = "0x55d398326f99059fF775485246999027B3197955";

    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);

    const HorseRaceWeekly = await hre.ethers.getContractFactory("HorseRaceWeekly");
    console.log('start deploy HorseRaceWeekly...');
    // nft holder : alice
    const horseRaceWeekly = await HorseRaceWeekly.deploy(Admin.address, USDT);
    await horseRaceWeekly.deployed();
    console.log("HorseRaceWeekly deployed to: ", horseRaceWeekly.address);
    saveContractAddress(hre.network.name, "HorseRaceWeekly-USDT", horseRaceWeekly.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
