const hre = require("hardhat");
const { saveContractAddress } = require('../utils')

async function main() {
    const tokenName = "Brewery";
    const symbol = "BRE";
    const totalSupply = "1000000000000000000000000000";
    const decimals = 18;

    const MCK = await hre.ethers.getContractFactory("BreToken");
    const token = await MCK.deploy(tokenName, symbol, totalSupply, decimals);
    await token.deployed();
    console.log("BRE deployed to: ", token.address);

    saveContractAddress(hre.network.name, "BRE-TOKEN", token.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
