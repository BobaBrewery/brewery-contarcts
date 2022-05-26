const hre = require("hardhat");
const { saveContractAbi } = require('./utils');


async function main() {
    await hre.run('compile');

    // saveContractAbi(hre.network.name, 'Admin', (await hre.artifacts.readArtifact("Admin")).abi)
    // saveContractAbi(hre.network.name, 'SalesFactory', (await hre.artifacts.readArtifact("SalesFactory")).abi)
    // saveContractAbi(hre.network.name, 'AllocationStaking', (await hre.artifacts.readArtifact("AllocationStaking")).abi)
    // saveContractAbi(hre.network.name, 'BrewerySale', (await hre.artifacts.readArtifact("BrewerySale")).abi)
    // saveContractAbi(hre.network.name, 'NFTMinter', (await hre.artifacts.readArtifact("NFTMinter")).abi)
    saveContractAbi(hre.network.name, 'CyberPopWLMinter', (await hre.artifacts.readArtifact("CyberPopWLMinter")).abi)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
