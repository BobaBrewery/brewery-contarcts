const hre = require("hardhat");
const {getSavedContractAddresses } = require('../utils')

// Call using the private key of the owner's address of the BRE token
async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];

    const allocationStaking = await hre.ethers.getContractAt('AllocationStaking', contracts['AllocationStakingProxy']);
    
    // Fund
    await allocationStaking.fund(ethers.utils.parseEther('20000000'));
    console.log('Funded 20000000 tokens')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
