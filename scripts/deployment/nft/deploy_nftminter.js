const hre = require("hardhat");
const {ethers} = require("hardhat");
const {saveContractAddress, getSavedContractAddresses} = require('../../utils')

const MINT_ROLE_BYTES32 = hre.web3.utils.keccak256(hre.web3.utils.asciiToHex("NFT_MINTER_ROLE"))
const COUNTER = 300
const ADMINS = [
    //eth mainnet
    "0x7210D475C0F2e622de6CFbD1AFF94A0C2fA12fDE",
    "0x71C4a2860278AF34752A235581cA766df4207318"
    // test
    // "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    // "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
]

const NFT_ADDR = "0xd0665D59Eb133b7BAec5c41EB48C773F0Fc1dF46"

async function main() {
    const AdminFactory = await ethers.getContractFactory("Admin");
    let admin_contract = await AdminFactory.deploy(ADMINS);
    console.log('admin deployed to :', admin_contract.address)
    saveContractAddress(hre.network.name, "Admin", admin_contract.address);
    const Minter = await hre.ethers.getContractFactory("NFTMinter");
    // const nft = await hre.ethers.getContractAt("MedievalNFT", contracts["MedievalNFT"])
    console.log('start deploy minter...')
    const minter = await Minter.deploy(admin_contract.address, NFT_ADDR);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "NFTMinter", minter.address);

    await minter.setBatchCounter(COUNTER)
    console.log('Batch count set')

    // grant mint role
    // await nft.grantRole(MINT_ROLE_BYTES32, minter.address);
    // console.log('mint role granted')
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
