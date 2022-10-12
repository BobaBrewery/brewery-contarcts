const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const token = await ethers.getContractAt('BreToken', contracts['BOBA-MOCK-TOKEN']);
    console.log("MOCK-TOKEN contract address: ", token.address);
    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const NUMBER_1E18 = "1000000000000000000";
    const approveAmount = BigNumber.from(10000).mul(NUMBER_1E18);
    await token.approve(LuckyStar.address, approveAmount)

    await LuckyStar.buy(5, 10, 5);

    // await LuckyStar.buy(100, 1, 7);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
