const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const curTime = parseInt(Date.now() / 1000);
    console.log("curTime:", curTime);

    const NUMBER_1E18 = "1000000000000000000";
    const price = BigNumber.from(1).mul(NUMBER_1E18);

    // onlyOwner
    await LuckyStar.activate(1002, 1001, price, 100, curTime + 60 * 60 * 24);

    // await LuckyStar.activate(100, 1, 1000000, 100, curTime + 60 * 60 * 24);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
