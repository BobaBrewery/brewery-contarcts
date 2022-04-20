const hre = require("hardhat");
const {ethers} = require("hardhat");

async function main() {
    const MedievalNFT = await ethers.getContractFactory("MedievalNFT");
    const nft = await MedievalNFT.deploy();
    await nft.deployed();
    console.log("NFT deployed to: ", nft.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
