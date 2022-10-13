const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils')
const yesno = require('yesno');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const FUNDER_ADDRESS = "0x24e1Ae757ca647101B0e7614217b7AE26338F578";
    const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

    const Admin = await hre.ethers.getContractAt('Admin', contracts['Admin']);
    console.log("Admin contract deployed to: ", Admin.address);
    // saveContractAddress(hre.network.name, "Admin", Admin.address);

    const LuckyStar = await hre.ethers.getContractFactory("LuckyStar");
    const luckyStar = await LuckyStar.deploy(Admin.address, TOKEN_ADDRESS, FUNDER_ADDRESS);
    await luckyStar.deployed();
    saveContractAddress(hre.network.name, "LuckyStar", luckyStar.address);
    console.log('LuckyStar deployed to: ', luckyStar.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
