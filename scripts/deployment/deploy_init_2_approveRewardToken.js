const hre = require("hardhat");
const {getSavedContractAddresses } = require('../utils')
const config = require('../configs/config.json');


// Call using the private key of the owner's address of the pledged token
async function main() {
    const c = config[hre.network.name];
    const contracts = getSavedContractAddresses()[hre.network.name];

    const totalRewards = hre.ethers.utils.parseEther(c.initialRewardsAllocationStaking);

    const token = await hre.ethers.getContractAt('BreToken', contracts['BRE-TOKEN']);
    const allocationStaking = await hre.ethers.getContractAt('AllocationStaking', contracts['AllocationStakingProxy']);

    console.log("ready to approve ", c.initialRewardsAllocationStaking, " token to staking  ")
    await token.approve(allocationStaking.address, totalRewards);
    console.log(`token.approve(${allocationStaking.address}, ${totalRewards.toString()});`)
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
