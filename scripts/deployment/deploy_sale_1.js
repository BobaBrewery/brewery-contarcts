const hre = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils')
const config = require("../configs/saleConfig.json");
const yesno = require("yesno");
const { ethers, web3 } = hre

async function getCurrentBlockTimestamp() {
    return (await ethers.provider.getBlock('latest')).timestamp;
}

const delay = ms => new Promise(res => setTimeout(res, ms));
const delayLength = 3000;

async function main() {

    const contracts = getSavedContractAddresses()[hre.network.name];
    const c = config[hre.network.name];
    paymentToken = c['paymentToken']
    console.log(`Payment token address is ${paymentToken}`);

    const salesFactory = await hre.ethers.getContractAt('SalesFactory', contracts['SalesFactory']);

    const tx = await salesFactory.deploySale(paymentToken);
    console.log('Sale is deployed successfully.');

    let ok = await yesno({
        question: 'Are you sure you want to continue?'
    });
    if (!ok) {
        process.exit(0)
    }

    const lastDeployedSale = await salesFactory.getLastDeployedSale();
    console.log('Deployed Sale address is: ', lastDeployedSale);

    const sale = await hre.ethers.getContractAt('BrewerySale', lastDeployedSale);
    console.log(`Successfully instantiated sale contract at address: ${lastDeployedSale}.`);

    const totalTokens = ethers.utils.parseEther(c['totalTokens']);
    console.log('Total tokens to sell: ', c['totalTokens']);

    const tokenPriceInPT = ethers.utils.parseUnits(c['tokenPriceInPT'], c["PTDecimal"]);
    console.log('tokenPriceInPT:', c['tokenPriceInPT']);

    const saleOwner = c['saleOwner'];
    console.log('Sale owner is: ', c['saleOwner']);


    const registrationStart = c['registrationStartAt'];
    const registrationEnd = registrationStart + c['registrationLength'];
    const saleStartTime = registrationEnd + c['delayBetweenRegistrationAndSale'];
    const saleEndTime = saleStartTime + c['saleRoundLength'];
    const maxParticipation = ethers.utils.parseEther(c['maxParticipation']);

    const tokensUnlockTime = c['TGE'];

    console.log("ready to set sale params")
    // ok = await yesno({
    //     question: 'Are you sure you want to continue?'
    // });
    // if (!ok) {
    //     process.exit(0)
    // }
    await sale.setSaleParams(
        c['tokenAddress'],
        saleOwner,
        tokenPriceInPT.toString(),
        totalTokens.toString(),
        saleEndTime,
        tokensUnlockTime,
        c['portionVestingPrecision'],
        maxParticipation.toString()
    );

    console.log('Sale Params set successfully.');

    console.log('Setting registration time.');
    //
    // ok = await yesno({
    //     question: 'Are you sure you want to continue?'
    // });
    // if (!ok) {
    //     process.exit(0)
    // }

    await sale.setRegistrationTime(
        registrationStart,
        registrationEnd
    );

    console.log('Registration time set.');

    console.log('Setting saleStart.');
    //
    // ok = await yesno({
    //     question: 'Are you sure you want to continue?'
    // });
    // if (!ok) {
    //     process.exit(0)
    // }
    await sale.setSaleStart(saleStartTime);

    const unlockingTimes = c['unlockingTimes'];
    const percents = c['portionPercents'];

    console.log('Unlocking times: ', unlockingTimes);
    console.log('Percents: ', percents);
    console.log('Precision for vesting: ', c['portionVestingPrecision']);
    console.log('Max vesting time shift in seconds: ', c['maxVestingTimeShift']);

    console.log('Setting vesting params.');
    //
    // ok = await yesno({
    //     question: 'Are you sure you want to continue?'
    // });
    // if (!ok) {
    //     process.exit(0)
    // }
    await sale.setVestingParams(unlockingTimes, percents, c['maxVestingTimeShift']);

    console.log('Vesting parameters set successfully.');

    console.log({
        saleAddress: lastDeployedSale,
        saleToken: c['tokenAddress'],
        paymentToken: c['paymentToken'],
        saleOwner,
        tokenPriceInPT: tokenPriceInPT.toString(),
        totalTokens: totalTokens.toString(),
        saleEndTime,
        tokensUnlockTime,
        registrationStart,
        registrationEnd,
        saleStartTime
    });
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
