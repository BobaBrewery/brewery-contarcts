const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils');
const { ethers } = require("hardhat");


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const mock_Token = await hre.ethers.getContractAt("BreToken", contracts["MOCK-TOKEN"]);
    console.log("MOCK-TOKEN address is: ", mock_Token.address);
    const decimal = await mock_Token.decimals();
    console.log("MOCK-TOKEN decimal is: ", decimal);
    const symbol = await mock_Token.symbol();
    console.log("MOCK-TOKEN symbol is: ", symbol);
    const horseRaceWeekly = await hre.ethers.getContractAt("HorseRaceWeekly", contracts["HorseRaceWeekly"]);
    console.log("HorseRaceWeekly address is: ", horseRaceWeekly.address);

    const approveAmount = ethers.utils.parseUnits("1000000", decimal);
    const periodId = 14;
    const horseId = 7;
    const amount = ethers.utils.parseUnits("1000", decimal);
    await horseRaceWeekly.bet(periodId, horseId, amount);
    console.log(`第${periodId}期, 第${horseId}匹马, 下注了${ethers.utils.formatUnits(amount, decimal)} $${symbol}`);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
