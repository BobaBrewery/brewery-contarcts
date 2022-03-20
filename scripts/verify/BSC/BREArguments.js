

const tokenName = "Brewery";
// const tokenName = "Pailie";
const symbol = "BRE";
// const symbol = "PL";
const totalSupply = "1000000000000000000000000000";
const decimals = 18;

module.exports = [
    tokenName, symbol, totalSupply, decimals
];


// npx hardhat verify --network bsc_testnet --constructor-args .\scripts\verify\BSC\BREArguments.js 0x10E2c167C1c1eDe5FB899501Ea9c39A566244ff5