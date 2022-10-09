const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils');


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const hash = "";
    // onlyOwner
    await LuckyStar.archive(5, 1, hash);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
