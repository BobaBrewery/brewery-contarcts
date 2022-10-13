const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    // get account
    const [acc1, acc2] = await ethers.getSigners();
    console.log(acc1.address, acc2.address)

    const token = await ethers.getContractAt('BreToken', contracts['BOBA-MOCK-TOKEN']);
    console.log("MOCK-TOKEN contract address: ", token.address);

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const NUMBER_1E18 = "1000000000000000000";
    const approveAmount = BigNumber.from(10000).mul(NUMBER_1E18);

    // await token.connect(acc1).approve(LuckyStar.address, approveAmount);
    // await token.connect(acc2).approve(LuckyStar.address, approveAmount);

    const aaa = LuckyStar.connect(acc1).buy(1002, 1011, 2);
    const bbb = LuckyStar.connect(acc2).buy(1002, 1011, 2);

    await Promise.all([aaa, bbb])
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
