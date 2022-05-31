const hre = require("hardhat");
const { saveContractAddress } = require('../utils')

async function main() {
    const contract = await hre.ethers.getContractFactory("Disperse");
    const disperse = await contract.deploy();
    await disperse.deployed();
    console.log("disperse deployed to: ", disperse.address);

    saveContractAddress(hre.network.name, "Disperse", disperse.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
