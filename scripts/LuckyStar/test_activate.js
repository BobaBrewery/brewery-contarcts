const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const FUNDER_ADDRESS = "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317";
    const TOKEN_ADDRESS = "0xF28AF9985DB3A64E5A298129e73686338D075FD1";

    // const Admin = await hre.ethers.getContractAt('Admin', contracts['Admin']);
    // console.log("Admin contract deployed to: ", Admin.address);
    // saveContractAddress(hre.network.name, "Admin", Admin.address);

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const curTime = parseInt(Date.now() / 1000);
    console.log("curTime:", curTime);

    // const hsah = ethers.utils.keccak256(curTime);
    console.log("hash:", ethers.utils.keccak256(curTime));
    await LuckyStar.activate(5, 3, 100000, 5, curTime + 60 * 60 * 4, ethers.utils.keccak256(curTime));

    // await LuckyStar.buy(5, 2, 3);

    await LuckyStar.activate(100, 1, 1000000, 100, curTime + 60 * 60 * 24, ethers.utils.keccak256(curTime));
    // await LuckyStar.buy(100,1,70);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
