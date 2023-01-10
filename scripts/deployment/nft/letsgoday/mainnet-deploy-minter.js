const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const NFTHolder = "0x24e1Ae757ca647101B0e7614217b7AE26338F578";
    const PayToken = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const ERC1155Token = "0x102d8123C421Ab8f09585864B95C22dF8BB9058c";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);
    console.log("PayToken address:", PayToken);

    const Minter = await hre.ethers.getContractFactory("LetsGoDayMinter");
    console.log('start deploy minter...');
    // nft holder : alice
    const minter = await Minter.deploy(Admin.address, NFTHolder, PayToken, ERC1155Token);
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
