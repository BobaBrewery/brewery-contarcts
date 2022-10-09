const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const FUNDER_ADDRESS = "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317";
    const TOKEN_ADDRESS = "0xF28AF9985DB3A64E5A298129e73686338D075FD1";

    // const Admin = await hre.ethers.getContractAt('Admin', contracts['Admin']);
    // console.log("Admin contract deployed to: ", Admin.address);
    // saveContractAddress(hre.network.name, "Admin", Admin.address);

    const LuckyStar = await hre.ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const codes = await LuckyStar.getCodesByUser(100, 1, "0xFfAB57f206203a5dE70B18c16ECC4173C882834f")
    console.log('codes: ', codes);
    console.log('codes length: ', codes.length);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
