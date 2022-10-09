const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const token = await ethers.getContractAt('BreToken', contracts['MOCK-TOKEN']);
    console.log("MOCK-TOKEN contract address: ", token.address);
    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    await token.approve(LuckyStar.address, 10000000000)

    // await LuckyStar.buy(5, 2, 1);

    await LuckyStar.buy(100, 1, 7);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
