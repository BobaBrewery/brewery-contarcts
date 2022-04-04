const hre = require("hardhat");
const { getSavedContractAddresses } = require('../utils')


async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];

    const token = await hre.ethers.getContractAt('BreToken', contracts['BRE-TOKEN']);
    const allocationStaking = await hre.ethers.getContractAt('AllocationStaking', contracts['AllocationStakingProxy']);

    // add pool
    symbol = await token.symbol()
    console.log(`ready to add $BRE to pool`)
    await allocationStaking.add(0, token.address, true);
    console.log(`bre added: allocationStaking.add(${token.address});`)

    await allocationStaking.add(100, contracts['BOBA-LP-TOKEN'], true);
    console.log(`lp-token added: allocationStaking.add(${contracts['BOBA-LP-TOKEN']}});`)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
