const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {
    const NFTHolder = "0x615fDC569f5FF6Fc832d5968f73f917F13471200";
    const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const LLBOX = "0xB4374ccf5dcC0240aa38EA8AA58c74d26f73FaDa";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const Admin = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log("Admin address:", Admin.address);

    const Minter = await hre.ethers.getContractFactory("LostLandMinter");
    console.log('start deploy minter...');
    // nft holder : alice
    const minter = await Minter.deploy(Admin.address, LLBOX, USDT, NFTHolder);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "LostLandMinter", minter.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
