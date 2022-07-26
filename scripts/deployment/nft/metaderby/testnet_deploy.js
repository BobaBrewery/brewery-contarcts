const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = contracts["Admin"];
    const Mock_Token = contracts["MOCK-TOKEN"];
    console.log("Admin address:", Admin);
    console.log("MOCK-TOKEN address:", Mock_Token);

    const HorseRace = await hre.ethers.getContractFactory("HorseRace");
    console.log('start deploy HorseRace...');
    // nft holder : alice
    const horseRace = await HorseRace.deploy(Admin, Mock_Token);
    await horseRace.deployed();
    console.log("HorseRace deployed to: ", horseRace.address);
    saveContractAddress(hre.network.name, "HorseRace", horseRace.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
