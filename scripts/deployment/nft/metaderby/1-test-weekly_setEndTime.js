const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../../../utils')


async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];

    const horseRaceWeekly = await hre.ethers.getContractAt("HorseRaceWeekly", contracts["HorseRaceWeekly"]);
    console.log("HorseRaceWeekly address is: ", horseRaceWeekly.address);

    const periodId = 14;
    const endTime = parseInt(Date.now() / 1000) + 60 * 60 * 4
    await horseRaceWeekly.setBetEndTime(periodId, endTime);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
