const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils');
const { ethers } = require("hardhat");


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const mock_Token = await hre.ethers.getContractAt("BreToken", contracts["MOCK-TOKEN"]);
    console.log("MOCK-TOKEN address is: ", mock_Token.address);
    const decimal = await mock_Token.decimals();
    console.log("MOCK-TOKEN decimal is: ", decimal);
    const horseRaceWeekly = await hre.ethers.getContractAt("HorseRaceWeekly", contracts["HorseRaceWeekly"]);
    console.log("HorseRaceWeekly address is: ", horseRaceWeekly.address);

    const approveAmount = ethers.utils.parseUnits("1000000", decimal);
    await mock_Token.approve(horseRaceWeekly.address, approveAmount);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
