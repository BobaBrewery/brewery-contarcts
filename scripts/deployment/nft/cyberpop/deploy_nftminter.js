const hre = require("hardhat");
const {ethers} = require("hardhat");
const {saveContractAddress, getSavedContractAddresses} = require('../../../utils')

const MINT_ROLE_BYTES32 = hre.web3.utils.keccak256(hre.web3.utils.asciiToHex("NFT_MINTER_ROLE"))
const ADMINS = [
    //eth mainnet
    // "0x7210D475C0F2e622de6CFbD1AFF94A0C2fA12fDE",
    // "0x71C4a2860278AF34752A235581cA766df4207318",
    // test
    "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
]

const PROP_ADDR = "0xD4c27B5A5c15B1524FC909F0FE0d191C4e893695"
const EMPTY_ADDR = "0x0000000000000000000000000000000000000000"
const BOX_ADDR = "0x55eFD6D4cF31F925E36d268C12353848c9e782fD"
const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955"

async function main() {
    const contracts = getSavedContractAddresses()[hre.network.name];
    let admin_contract = await ethers.getContractAt("Admin", contracts["Admin"]);
    console.log('admin contract address:', admin_contract.address)

    const Minter = await hre.ethers.getContractFactory("CyberPopWLMinter");
    console.log('start deploy minter...');
    const minter = await Minter.deploy(admin_contract.address, EMPTY_ADDR, BSC_USDT);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "CyberPopWLMinter", minter.address);


    // await minter.setBatchCounter(COUNTER)
    // console.log('Batch count set')
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
