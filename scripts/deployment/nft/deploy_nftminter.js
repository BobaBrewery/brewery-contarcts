const hre = require("hardhat");
const {ethers} = require("hardhat");
const {saveContractAddress, getSavedContractAddresses} = require('../../utils')

const MINT_ROLE_BYTES32 = hre.web3.utils.keccak256(hre.web3.utils.asciiToHex("NFT_MINTER_ROLE"))
const COUNTER = 20
const ADMINS = [
    "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
]

async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];
    // const AdminFactory = await ethers.getContractFactory("Admin");
    // let admin_contract = await AdminFactory.deploy(ADMINS);
    const admin_contract = await hre.ethers.getContractAt("Admin", contracts["Admin"])
    // console.log('admin deployed to :', admin_contract.address)
    // saveContractAddress(hre.network.name, "Admin", admin_contract.address);
    const Minter = await hre.ethers.getContractFactory("NFTMinter");
    const nft = await hre.ethers.getContractAt("MedievalNFT", contracts["MedievalNFT"])
    console.log('start deploy minter...')
    const minter = await Minter.deploy(admin_contract.address, nft.address);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "NFTMinter", minter.address);

    await minter.setBatchCounter(COUNTER)
    console.log('Batch count set')

    // grant mint role
    await nft.grantRole(MINT_ROLE_BYTES32, minter.address);
    console.log('mint role granted')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
