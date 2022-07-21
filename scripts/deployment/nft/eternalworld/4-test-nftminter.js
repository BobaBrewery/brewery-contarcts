const hre = require("hardhat");
const { ethers } = require("hardhat");
const ethUtil = require("ethereumjs-util")
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')
const { BigNumber } = require("ethers");

const NUMBER_1E18 = "1000000000000000000";



const price = BigNumber.from("10").mul(BigNumber.from(NUMBER_1E18));
const amount = 3;


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
    // const alice = accounts[1]
    const bob = accounts[1]

    const contracts = getSavedContractAddresses()[hre.network.name];
    const usdt_address = contracts["MOCK-TOKEN"]
    const minter_address = contracts["EternalWorldMinter"]
    console.log(usdt_address, minter_address);

    const minter = await hre.ethers.getContractAt("WLMinter", minter_address);

    // get sigs
    const sig0 = sign(bob.address, price, amount, minter_address, "702b0c8d127e662aff3fbdba0e797b6598f50cc8712230be879196343bba724f")

    // approve usdt
    const usdt = await hre.ethers.getContractAt("BreToken", usdt_address);
    await usdt.connect(bob).approve(minter_address, BigNumber.from("100000").mul(BigNumber.from(NUMBER_1E18)))

    const balanceBefore = await usdt.balanceOf(bob.address);
    console.log("balance before:", balanceBefore)

    await minter.connect(bob).mint(amount, price, sig0)

    const payment = price.mul(amount);
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
