const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    await LuckyStar.refund(5, 1);

    // await LuckyStar.refund(100, 1);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
