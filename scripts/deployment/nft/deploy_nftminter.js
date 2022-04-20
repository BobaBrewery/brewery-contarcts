const hre = require("hardhat");
const {ethers} = require("hardhat");
const {saveContractAddress, getSavedContractAddresses} = require('../../utils')

const MINT_ROLE_BYTES32 = hre.web3.utils.keccak256(hre.web3.utils.asciiToHex("NFT_MINTER_ROLE"))
const COUNTER = 2000
const PRICE = hre.ethers.utils.parseEther("0.1")
const ADMINS = [
    "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
]

async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];
    const AdminFactory = await ethers.getContractFactory("Admin");
    let admin_contract = await AdminFactory.deploy(ADMINS);
    saveContractAddress(hre.network.name, "Admin", admin_contract.address);
    const Minter = await hre.ethers.getContractFactory("NFTMinter");
    const nft = await hre.ethers.getContractAt("MedievalNFT", contracts["MedievalNFT"])
    const minter = await Minter.deploy(admin_contract.address, nft.address);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "NFTMinter", minter.address);

    await minter.setPrice(PRICE, COUNTER)

    // grant mint role
    await nft.grantRole(MINT_ROLE_BYTES32, minter.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
