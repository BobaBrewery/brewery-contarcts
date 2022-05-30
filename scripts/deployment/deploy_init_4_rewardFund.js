const hre = require("hardhat");
const { getSavedContractAddresses } = require('../utils');
const config = require('../configs/config.json');

// Call using the private key of the owner's address of the BRE token
async function main() {
    const c = config[hre.network.name];
    const contracts = getSavedContractAddresses()[hre.network.name];

    const allocationStaking = await hre.ethers.getContractAt('AllocationStaking', contracts['AllocationStakingProxy']);

    // Fund
    await allocationStaking.fund(ethers.utils.parseEther(c.initialRewardsAllocationStaking));
    console.log(`Funded ${c.initialRewardsAllocationStaking} tokens`);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
