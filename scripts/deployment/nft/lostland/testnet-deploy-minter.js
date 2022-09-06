const hre = require("hardhat");
const { ethers } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')
const ADMINS = [
    //eth mainnet
    // "0x7210D475C0F2e622de6CFbD1AFF94A0C2fA12fDE",
    // "0x71C4a2860278AF34752A235581cA766df4207318",
    // test
    "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317",
]

async function main() {
    const NFTHolder = "0xFfAB57f206203a5dE70B18c16ECC4173C882834f";
    const USDT = "0xF28AF9985DB3A64E5A298129e73686338D075FD1";
    const LLBOX = "0xdfe492ea8744e2443866940c6bd99df234ef535e";


    const contracts = getSavedContractAddresses()[hre.network.name];

    const AdminFactory = await ethers.getContractFactory("Admin");
    const admin_contract = await AdminFactory.deploy(ADMINS);
    await admin_contract.deployed();
    saveContractAddress(hre.network.name, "Admin", admin_contract.address);

    const Minter = await hre.ethers.getContractFactory("LostLandMinter");
    console.log('start deploy minter...');
    // nft holder : alice
    const minter = await Minter.deploy(admin_contract.address, LLBOX, USDT, NFTHolder);
    await minter.deployed();
    console.log("Minter deployed to: ", minter.address);
    saveContractAddress(hre.network.name, "LostLandMinter", minter.address);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
