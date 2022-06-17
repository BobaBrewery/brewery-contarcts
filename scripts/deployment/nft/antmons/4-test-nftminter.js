const hre = require("hardhat");
const {ethers} = require("hardhat");
const ethUtil = require("ethereumjs-util")
const {saveContractAddress, getSavedContractAddresses} = require('../../../utils')
const {BigNumber} = require("ethers");

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

const lvl_one_price = BigNumber.from("50").mul(BigNumber.from(NUMBER_1E18))
const lvl_two_price = BigNumber.from("100").mul(BigNumber.from(NUMBER_1E18))
const lvl_three_price = BigNumber.from("200").mul(BigNumber.from(NUMBER_1E18))

const lvl_one = 0
const lvl_two = 1
const lvl_three = 2

function generateSignature(digest, privateKey) {
    // prefix with "\x19Ethereum Signed Message:\n32"
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/890
    const prefixedHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(digest));

    // sign message
    const {v, r, s} = ethUtil.ecsign(prefixedHash, Buffer.from(privateKey, 'hex'))

    // generate signature by concatenating r(32), s(32), v(1) in this order
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/76fe1548aee183dfcc395364f0745fe153a56141/contracts/ECRecovery.sol#L39-L43
    const vb = Buffer.from([v]);
    return Buffer.concat([r, s, vb]);
}

function sign(userAddress, price, amount, contractAddress, privateKey) {
    // console.log(userAddress)
    // console.log(price)
    // console.log(amount)
    // console.log(contractAddress)
    // compute keccak256(abi.encodePacked(user, amount))
    const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'address'], [userAddress, price, amount, contractAddress]));

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
    const minter_address = contracts["AntmonsMinter"]

    const minter = await hre.ethers.getContractAt("AntmonsMinter", minter_address);

    const nft = await ethers.getContractAt("MedievalNFT", nft_address)


    // get sigs
    const sig0 = sign(bob.address, lvl_one_price, 3, minter_address, "8b69d2a26af8866a78d81f72145f156413766aeec293b9b0aa17c4ce1a5630b6")

    // approve usdt
    const usdt = await hre.ethers.getContractAt("BreToken", usdt_address);
    await usdt.connect(bob).approve(minter_address, BigNumber.from("10000").mul(BigNumber.from(NUMBER_1E18)))

    const balanceBefore = await usdt.balanceOf(bob.address);
    console.log("balance before:", balanceBefore)

    await minter.connect(bob).mint(3, lvl_one, lvl_one_price, sig0)

//    check balance
    const nftAmount = await nft.balanceOf(bob.address)
    console.log("get nft:", nftAmount)

    const balanceAfter = await usdt.balanceOf(bob.address);
    console.log("balance after:", balanceAfter)

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
