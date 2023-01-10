const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const NFTHolder = "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317";
    // const PayToken = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const ERC1155Token = "0x01D1ef88c765765BB97DBbE7BF81a0B6916cDf54";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);
    const PayToken = await ethers.getContractAt("BreToken", contracts["MOCK-TOKEN"]);
    console.log("PayToken address:", PayToken.address);

    const Minter = await hre.ethers.getContractFactory("LetsGoDayMinter");
    console.log('start deploy minter...');
    // nft holder : alice
    const minter = await Minter.deploy(Admin.address, NFTHolder, PayToken.address, ERC1155Token);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "LetsGoDayMinter", minter.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
