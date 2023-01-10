const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const NFTHolder = "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317";
    // const PayToken = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const ERC1155Token = "0x01D1ef88c765765BB97DBbE7BF81a0B6916cDf54";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const minter = await ethers.getContractAt("LetsGoDayMinter", contracts["LetsGoDayMinter"]);
    console.log("Minter address:", minter.address);
    const erc1155 = await hre.ethers.getContractAt('MockERC1155', ERC1155Token);
    console.log("ERC1155Token address:", erc1155.address);

    // const uri = await erc1155.uri(0);
    // console.log(`TokenId[0] Uri is ${uri}`);

    await erc1155.setApprovalForAll(minter.address, true);
    let result = await erc1155.isApprovedForAll(NFTHolder, minter.address)
    console.log("isApprovedForAll:", result);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
