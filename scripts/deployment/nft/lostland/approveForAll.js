const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


// Call using the private key of the owner's address of the pledged token
async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];


    const erc1155 = await hre.ethers.getContractAt('MockERC1155', "0xdfe492ea8744e2443866940c6bd99df234ef535e");
    // const allocationStaking = await hre.ethers.getContractAt('AllocationStaking', contracts['AllocationStakingProxy']);

    // console.log("ready to approve ", c.initialRewardsAllocationStaking, " token to staking  
    await erc1155.setApprovalForAll("0xBB813db1C0f839378e6AE1911ee75F491C5c2e0b", true);
    let result = await erc1155.isApprovedForAll("0xFfAB57f206203a5dE70B18c16ECC4173C882834f", "0xBB813db1C0f839378e6AE1911ee75F491C5c2e0b")
    console.log("isApprovedForAll:", result);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
