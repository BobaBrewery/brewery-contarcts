const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = contracts["Admin"];
    const Mock_Token = contracts["MOCK-TOKEN"];
    console.log("Admin address:", Admin);
    console.log("MOCK-TOKEN address:", Mock_Token);

    const HorseRaceWeekly = await hre.ethers.getContractFactory("HorseRaceWeekly");
    console.log('start deploy HorseRaceWeekly...');
    // nft holder : alice
    const horseRaceWeekly = await HorseRaceWeekly.deploy(Admin, Mock_Token);
    await horseRaceWeekly.deployed();
    console.log("HorseRaceWeekly deployed to: ", horseRaceWeekly.address);
    saveContractAddress(hre.network.name, "HorseRaceWeekly", horseRaceWeekly.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
