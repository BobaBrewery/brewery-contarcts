const hre = require("hardhat");
const { ethers } = require("hardhat");
const ethUtil = require("ethereumjs-util")
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')
const { BigNumber } = require("ethers");

const NUMBER_1E18 = "1000000000000000000";

const ADMINS = [
    //eth mainnet
    // "0x7210D475C0F2e622de6CFbD1AFF94A0C2fA12fDE",
    // "0x71C4a2860278AF34752A235581cA766df4207318",
    // test
    // "0xe6CEf4eE7c2757dF130a63e85a3849Ec56E812ef",
    // "0x0f590970a45d0b4c2dcfcaFF453400eE9B91B317"
    // local
    "0x84E25cCD4375b37C21A18873e4184B4A56b89930"
]


const price = BigNumber.from("150").mul(BigNumber.from(NUMBER_1E18));
const tokenIds = [133, 149, 199];


function generateSignature(digest, privateKey) {
    // prefix with "\x19Ethereum Signed Message:\n32"
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/890
    const prefixedHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(digest));

    // sign message
    const { v, r, s } = ethUtil.ecsign(prefixedHash, Buffer.from(privateKey, 'hex'))

    // generate signature by concatenating r(32), s(32), v(1) in this order
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/76fe1548aee183dfcc395364f0745fe153a56141/contracts/ECRecovery.sol#L39-L43
    const vb = Buffer.from([v]);
    return Buffer.concat([r, s, vb]);
}

function sign(userAddress, tokenIds, price, deadline, contractAddress, privateKey) {
    // console.log(userAddress)
    // console.log(price)
    // console.log(amount)
    // console.log(contractAddress)
    // compute keccak256(abi.encodePacked(user, amount))
    const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256[]', 'uint256', 'uint256', 'address'], [userAddress, tokenIds, price, deadline, contractAddress]));

    return generateSignature(digest, privateKey);
}

async function main() {
    const accounts = await ethers.getSigners()
    const deployer = accounts[0]
    const alice = accounts[1]
    const bob = accounts[2]

    const contracts = getSavedContractAddresses()[hre.network.name];
    const nft_address = contracts["MedievalNFT"]
    const usdt_address = contracts["MOCK-TOKEN"]
    const minter_address = contracts["MoveMinter"]

    const minter = await hre.ethers.getContractAt("MoveMinter", minter_address);

    const nft = await ethers.getContractAt("MedievalNFT", nft_address)


    // get sigs
    const deadline = (Date.parse(new Date()) / 1000) - 60;
    const sig0 = sign(bob.address, tokenIds, price, deadline, minter_address, "88e246145b3cac6742cb06d1e6459abc704e3ec79d81306e55582bc27e2932fe")

    // approve usdt
    const usdt = await hre.ethers.getContractAt("BreToken", usdt_address);
    await usdt.connect(bob).approve(minter_address, BigNumber.from("100000").mul(BigNumber.from(NUMBER_1E18)))

    const balanceBefore = await usdt.balanceOf(bob.address);
    console.log("balance before:", balanceBefore)

    await minter.connect(bob).mint(tokenIds, price, deadline, sig0)

    //    check balance
    const nftAmount = await nft.balanceOf(bob.address)
    console.log("get nft number:", nftAmount)

    for (let i = 0; i < nftAmount; i++) {
        const tokenId = await nft.tokenOfOwnerByIndex(bob.address, i)
        console.log("tokenID:", tokenId);
    }

    const payment = price.mul(tokenIds.length);
    console.log("payment:", payment)


    const balanceAfter = await usdt.balanceOf(bob.address);
    console.log("balance after:", balanceAfter);

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
