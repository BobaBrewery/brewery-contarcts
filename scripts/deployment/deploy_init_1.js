const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const { saveContractAddress, getSavedContractAddresses } = require('../utils')
const config = require('../configs/config.json');
const yesno = require('yesno');


async function getCurrentBlockTimestamp() {
    return (await ethers.provider.getBlock('latest')).timestamp;
}

async function main() {

    const c = config[hre.network.name];
    const contracts = getSavedContractAddresses()[hre.network.name];

    const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const Admin = await ethers.getContractFactory("Admin");
    console.log("ready to deploy admin")
    let ok = await yesno({
        question: 'Are you sure you want to continue?'
    });
    if (!ok) {
        process.exit(0)
    }
    const admin = await Admin.deploy(c.admins);
    await admin.deployed();
    console.log("Admin contract deployed to: ", admin.address);
    saveContractAddress(hre.network.name, "Admin", admin.address);


    console.log("ready to deploy salesFactory ")
    ok = await yesno({
        question: 'Are you sure you want to continue?'
    });
    if (!ok) {
        process.exit(0)
    }
    const SalesFactory = await ethers.getContractFactory("SalesFactory");
    const salesFactory = await SalesFactory.deploy(admin.address, ZERO_ADDRESS);
    await salesFactory.deployed();
    saveContractAddress(hre.network.name, "SalesFactory", salesFactory.address);
    console.log('Sales factory deployed to: ', salesFactory.address);


    console.log("ready to deploy AllocationStaking ")
    ok = await yesno({
        question: 'Are you sure you want to continue?'
    });
    if (!ok) {
        process.exit(0)
    }
    const currentBlockTimestamp = await getCurrentBlockTimestamp();
    const farmingStartTime = currentBlockTimestamp + c.delayBeforeStart;
    if (farmingStartTime <= parseInt(new Date().getTime()/1000)) {
        console.log("ERROR: The farm start time is less than the current time.");
        process.exit(0);
    }
    console.log('Farming starts at: ', farmingStartTime);
    const AllocationStaking = await ethers.getContractFactory("AllocationStaking");
    const allocationStaking = await upgrades.deployProxy(AllocationStaking, [
        contracts["BRE-TOKEN"],
        ethers.utils.parseEther(c.allocationStakingRPS),
        farmingStartTime,
        salesFactory.address
    ], { unsafeAllow: ['delegatecall'] }
    );
    await allocationStaking.deployed()
    console.log('AllocationStaking Proxy deployed to:', allocationStaking.address);
    saveContractAddress(hre.network.name, 'AllocationStakingProxy', allocationStaking.address);

    let proxyAdminContract = await upgrades.admin.getInstance();
    saveContractAddress(hre.network.name, 'ProxyAdmin', proxyAdminContract.address);
    console.log('Proxy Admin address is : ', proxyAdminContract.address);

    console.log("ready to setAllocationStaking params ")
    ok = await yesno({
        question: 'Are you sure you want to continue?'
    });
    if (!ok) {
        process.exit(0)
    }
    await salesFactory.setAllocationStaking(allocationStaking.address);
    console.log(`salesFactory.setAllocationStaking ${allocationStaking.address} done.;`);
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
