const { ethers } = require("hardhat");
const ethUtil = require("ethereumjs-util");
require('dotenv').config();
const { saveContractAddress, getSavedContractAddresses } = require('../utils');

const PK = "702b0c8d127e662aff3fbdba0e797b6598f50cc8712230be879196343bba724f";
// console.log("PK:", PK);

function generateSignature(digest, privateKey) {
    // prefix with "\x19Ethereum Signed Message:\n32"
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/890
    const prefixedHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(digest));

    // sign message
    const { v, r, s } = ethUtil.ecsign(prefixedHash, Buffer.from(privateKey, 'hex'))

    // generate signature by concatenating r(32), s(32), v(1) in this order
    // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/76fe1548aee183dfcc395364f0745fe153a56141/contracts/ECRecovery.sol#L39-L43
    const vb = Buffer.from([v]);
    const signature = Buffer.concat([r, s, vb]);

    return signature;
}

function signClaim(userAddress, poolId, periodId, luckyCode, claimAmount, contractAddress, privateKey) {
    // compute keccak256(abi.encodePacked(user, address(this)))
    const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'uint256', 'uint256', 'address'], [userAddress, poolId, periodId, luckyCode, claimAmount, contractAddress]));

    return generateSignature(digest, privateKey);
}


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];
    const user = "0xFfAB57f206203a5dE70B18c16ECC4173C882834f"

    const LuckyStar = await ethers.getContractAt('LuckyStar', contracts['LuckyStar']);
    console.log("LuckyStar contract address: ", LuckyStar.address);

    const poolId = 5;
    const periodId = 10;
    const luckyCode = 10000003;
    const claimAmount = 5000000;
    const sign = signClaim(user, poolId, periodId, luckyCode, claimAmount, LuckyStar.address, PK);
    console.log("Sign:", sign);

    await LuckyStar.claim(poolId, periodId, luckyCode, claimAmount, sign);

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
