const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const BRE = "0x9eBBEB7f6b842377714EAdD987CaA4510205107A";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);

    const HorseRace = await hre.ethers.getContractFactory("HorseRace");
    console.log('start deploy HorseRace...');
    // nft holder : alice
    const horseRace = await HorseRace.deploy(Admin.address, BRE);
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
