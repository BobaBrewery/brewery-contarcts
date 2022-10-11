const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils')
const yesno = require('yesno');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const FUNDER_ADDRESS = "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317";
    const TOKEN_ADDRESS = "0xa6518818DE27c355153976A1e631Da77F11b3E56";

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
