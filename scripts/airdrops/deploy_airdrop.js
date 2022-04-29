const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require("../utils");

async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const tokenAddress = '0x8AF8cF2B192280EFdd7Ef87AAa50EEB9FD59401a';

    const airdropContract = await Airdrop.deploy(tokenAddress, contracts['Admin']);
    await airdropContract.deployed();

    const tokenInstance = await hre.ethers.getContractAt('IERC20Metadata', tokenAddress);
    const symbol = await tokenInstance.symbol();

    console.log("Airdrop contract is deployed to: ", airdropContract.address);
    saveContractAddress(hre.network.name, `Airdrop${symbol}`, airdropContract.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
