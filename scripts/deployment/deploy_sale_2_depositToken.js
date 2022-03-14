const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils')
const config = require("../configs/saleConfig.json");
const yesno = require("yesno");
const { ethers, web3 } = hre

async function getCurrentBlockTimestamp() {
    return (await ethers.provider.getBlock('latest')).timestamp;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
const delayLength = 3000;

// Called from the saleOwner address.
async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];
    const c = config[hre.network.name];

    // sale token
    const token = await hre.ethers.getContractAt('BreToken', contracts['SALE-TOKEN']);

    const salesFactory = await hre.ethers.getContractAt('SalesFactory', contracts['SalesFactory']);

    const lastDeployedSale = await salesFactory.getLastDeployedSale();
    await token.approve(lastDeployedSale, ethers.utils.parseEther(c.totalTokens));
    console.log('Deployed Sale address is: ', lastDeployedSale);
    console.log(`token.approve(${token.address}, ${c.totalTokens});`)

    const sale = await hre.ethers.getContractAt('BrewerySale', lastDeployedSale);
    console.log(`Successfully instantiated sale contract at address: ${lastDeployedSale}.`);

    await sale.depositTokens()
    console.log("ido sale deposited")
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
