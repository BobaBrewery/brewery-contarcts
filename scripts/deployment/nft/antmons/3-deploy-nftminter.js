const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')

const MINT_ROLE_BYTES32 = hre.web3.utils.keccak256(hre.web3.utils.asciiToHex("NFT_MINTER_ROLE"))
const ADMINS = [
    //eth mainnet
    // "0x7210D475C0F2e622de6CFbD1AFF94A0C2fA12fDE",
    // "0x71C4a2860278AF34752A235581cA766df4207318",
    // test
    // "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    // "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
    // local
    "0x84E25cCD4375b37C21A18873e4184B4A56b89930",
    "0xD366f9Ab25203D1c4084517F643fd39799315B1d"
]

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]

    const AdminFactory = await ethers.getContractFactory("Admin");
    const admin_contract = await AdminFactory.deploy(ADMINS);
    await admin_contract.deployed();
    saveContractAddress(hre.network.name, "Admin", admin_contract.address);

    // const contracts = getSavedContractAddresses()[hre.network.name];
    // let admin_contract = await ethers.getContractFactory("Admin");
    // console.log('admin contract address:', admin_contract.address)

    const contracts = getSavedContractAddresses()[hre.network.name];
    const nft_address = contracts["MedievalNFT"]
    const usdt_address = contracts["MOCK-TOKEN"]

    const Minter = await hre.ethers.getContractFactory("AntmonsMinter");
    console.log('start deploy minter...');
    // nft holder : alice
    const minter = await Minter.deploy(admin_contract.address, nft_address, usdt_address, alice.address);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "AntmonsMinter", minter.address);


    // setApprovalForAll
    const nft = await ethers.getContractAt("MedievalNFT", nft_address)
    await nft.connect(alice).setApprovalForAll(minter.address, true)
    console.log("is minter approved? ", await nft.isApprovedForAll(alice.address, minter.address))

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
