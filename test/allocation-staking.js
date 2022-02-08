const {ethers} = require("hardhat");
const {expect} = require("chai");
const {BigNumber, utils} = require("ethers");

describe("AllocationStaking", function () {

    let Admin;
    let BreToken, BreLP1, BreLP2;
    let AllocationStaking;
    let AllocationStakingRewardsFactory;
    let SalesFactory;
    let deployer, alice, bob;
    let startTimestamp;

    let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

    const REWARDS_PER_SECOND = ethers.utils.parseUnits("0.1");
    const TOKENS_TO_ADD = ethers.utils.parseUnits("100000");
    const TOKENS_TO_SEND = ethers.utils.parseUnits("1000");
    const START_TIMESTAMP_DELTA = 600;
    const END_TIMESTAMP_DELTA = Math.floor(TOKENS_TO_ADD / REWARDS_PER_SECOND + 1);
    const ALLOC_POINT = 1000;
    const DEFAULT_DEPOSIT = 1000;
    const NUMBER_1E36 = "1000000000000000000000000000000000000";
    const DEFAULT_LP_APPROVAL = 10000;
    const DEFAULT_BALANCE_ALICE = 10000;

    async function getCurrentBlockTimestamp() {
        return (await ethers.provider.getBlock('latest')).timestamp;
    }

    async function baseSetup(params) {
        await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);
        await AllocationStaking.fund(TOKENS_TO_ADD);

        await AllocationStaking.add(ALLOC_POINT, BreLP1.address, false);
    }

    async function baseSetupTwoPools(params) {
        await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);
        await AllocationStaking.fund(TOKENS_TO_ADD);


        await AllocationStaking.add(ALLOC_POINT, BreLP1.address, false);
        await AllocationStaking.add(ALLOC_POINT, BreLP2.address, false);

        await BreLP1.approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);
        await BreLP1.connect(alice).approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);
        await BreLP1.connect(bob).approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);

        await BreLP2.approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);
        await BreLP2.connect(alice).approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);
        await BreLP2.connect(bob).approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);

        await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);
    }

    function computeExpectedReward(timestampNow, lastTimestamp, rewPerSec, poolAlloc, totalAlloc, poolDeposit) {
        const tnow = ethers.BigNumber.from(timestampNow);
        // console.log(parseInt(tnow));
        const tdif = tnow.sub(lastTimestamp);
        // console.log(parseInt(tdif));
        const totalRewards = tdif.mul(rewPerSec);
        // console.log(parseInt(totalRewards));
        const poolRewards = totalRewards.mul(poolAlloc).div(totalAlloc);
        // console.log(parseInt(poolRewards));
        const poolRewardsPerShare = poolRewards.mul(NUMBER_1E36).div(poolDeposit)
        // console.log(parseInt(poolRewardsPerShare));

        return poolRewardsPerShare;
    }

    beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        alice = accounts[1];
        bob = accounts[2];

        const AdminFactory = await ethers.getContractFactory("Admin");
        Admin = await AdminFactory.deploy([deployer.address, alice.address, bob.address]);

        const BreTokenFactory = await ethers.getContractFactory("BreToken");
        BreToken = await BreTokenFactory.deploy("Bre", "BRE", ethers.utils.parseUnits("1000000000"), 18);

        BreLP1 = await BreTokenFactory.deploy("BreLP1", "BRELP1", ethers.utils.parseUnits("100000000"), 18);
        BreLP2 = await BreTokenFactory.deploy("BreLP2", "BRELP2", ethers.utils.parseUnits("100000000"), 18);

        const SalesFactoryFactory = await ethers.getContractFactory("SalesFactory");
        SalesFactory = await SalesFactoryFactory.deploy(Admin.address, ZERO_ADDRESS);

        AllocationStakingRewardsFactory = await ethers.getContractFactory("AllocationStaking");
        const blockTimestamp = await getCurrentBlockTimestamp();
        startTimestamp = blockTimestamp + START_TIMESTAMP_DELTA;

        AllocationStaking = await AllocationStakingRewardsFactory.deploy();
        await AllocationStaking.initialize(BreToken.address, REWARDS_PER_SECOND, startTimestamp, SalesFactory.address);

        await SalesFactory.setAllocationStaking(AllocationStaking.address);

        await BreLP1.transfer(alice.address, DEFAULT_BALANCE_ALICE);
        await BreLP2.transfer(alice.address, DEFAULT_BALANCE_ALICE);
    });

    context("Setup", async function () {
        it("Should setup the token correctly", async function () {
            // When
            let decimals = await BreToken.decimals();
            let totalSupply = await BreToken.totalSupply();
            let deployerBalance = await BreToken.balanceOf(deployer.address);

            // Then
            expect(decimals).to.equal(18);
            expect(totalSupply).to.equal(ethers.utils.parseUnits("1000000000"));
            expect(totalSupply).to.equal(deployerBalance);
        });

        it("Should setup the reward contract with no pools", async function () {
            // When
            let poolLength = await AllocationStaking.poolLength();
            let rewardPerSecond = await AllocationStaking.rewardPerSecond();
            let owner = await AllocationStaking.owner();
            let totalRewards = await AllocationStaking.totalRewards();

            // Then
            expect(poolLength).to.equal(0);
            expect(rewardPerSecond).to.equal(REWARDS_PER_SECOND);
            expect(owner).to.equal(deployer.address);
            expect(totalRewards).to.equal(0);
        });

        it("Should add a pool successfully", async function () {
            // When
            await AllocationStaking.add(ALLOC_POINT, BreToken.address, false);

            // Then
            let poolLength = await AllocationStaking.poolLength();
            let totalAllocPoint = await AllocationStaking.totalAllocPoint();

            expect(poolLength).to.equal(1);
            expect(totalAllocPoint).to.equal(ALLOC_POINT);
        });

        it("Should add a pool successfully with mass update", async function () {
            // When
            await AllocationStaking.add(ALLOC_POINT, BreToken.address, true);

            // Then
            let poolLength = await AllocationStaking.poolLength();
            let totalAllocPoint = await AllocationStaking.totalAllocPoint();

            expect(poolLength).to.equal(1);
            expect(totalAllocPoint).to.equal(ALLOC_POINT);
        });

        it("Should set salesFactory", async function () {
            // Given
            const SalesFactoryFactory = await ethers.getContractFactory("SalesFactory");
            const SalesFactory2 = await SalesFactoryFactory.deploy(Admin.address, ZERO_ADDRESS);

            // When
            await AllocationStaking.setSalesFactory(SalesFactory2.address);

            // Then
            expect(await AllocationStaking.salesFactory()).to.equal(SalesFactory2.address);
        });
    });

    context("Fund", async function () {
        it("Should fund the farm successfully", async function () {
            // Given
            let deployerBalanceBefore = await BreToken.balanceOf(deployer.address);
            let rewardPerSecond = await AllocationStaking.rewardPerSecond();
            let startTimestamp = await AllocationStaking.startTimestamp();

            await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);
            await AllocationStaking.add(ALLOC_POINT, BreToken.address, false);

            // When
            await AllocationStaking.fund(TOKENS_TO_ADD);

            // Then
            let deployerBalanceAfter = await BreToken.balanceOf(deployer.address);
            let contractBalanceAfter = await BreToken.balanceOf(AllocationStaking.address);
            let endTimestampAfter = await AllocationStaking.endTimestamp();
            let totalRewardsAfter = await AllocationStaking.totalRewards();

            expect(deployerBalanceBefore.sub(deployerBalanceAfter)).to.equal(TOKENS_TO_ADD);
            expect(contractBalanceAfter).to.equal(TOKENS_TO_ADD);
            expect(endTimestampAfter).to.equal(startTimestamp.add(ethers.BigNumber.from(TOKENS_TO_ADD).div(rewardPerSecond)));
            expect(totalRewardsAfter).to.equal(TOKENS_TO_ADD);
        });

        it("Should not fund the farm after end date", async function () {
            // Given
            await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);

            // When
            await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
            await ethers.provider.send("evm_mine");

            // Then
            await expect(AllocationStaking.fund(TOKENS_TO_ADD)).to.be.revertedWith("fund: too late, the farm is closed");
        });

        it("Should not fund the farm if token was not approved", async function () {
            // Then
            await expect(AllocationStaking.fund(TOKENS_TO_ADD)).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
        });

        it("Should not fund the farm if reward per second is 0", async function () {
            // Given
            const blockTimestamp = await getCurrentBlockTimestamp();
            AllocationStaking = await AllocationStakingRewardsFactory.deploy();
            AllocationStaking.initialize(BreToken.address, 0, blockTimestamp + START_TIMESTAMP_DELTA, SalesFactory.address);
            await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);

            // Then
            await expect(AllocationStaking.fund(TOKENS_TO_ADD)).to.be.revertedWith("SafeMath: division by zero");
        });
    });

    context("Pools", async function () {
        describe("Add pools", async function () {
            it("Should add pool to list", async function () {
                // When
                await AllocationStaking.add(ALLOC_POINT, BreLP1.address, false);

                // Then
                const poolLength = await AllocationStaking.poolLength();
                const pool = await AllocationStaking.poolInfo(0);

                expect(poolLength).to.equal(1);
                expect(pool.lpToken).to.equal(BreLP1.address);
                expect(pool.allocPoint).to.equal(ALLOC_POINT);
                expect(pool.lastRewardTimestamp).to.equal(startTimestamp);
                expect(pool.accERC20PerShare).to.equal(0);
                expect(pool.totalDeposits).to.equal(0);

                expect(await AllocationStaking.totalAllocPoint()).to.equal(ALLOC_POINT);
            });

            it("Should add two pools to list", async function () {
                // When
                await AllocationStaking.add(ALLOC_POINT, BreLP1.address, false);
                await AllocationStaking.add(ALLOC_POINT, BreLP2.address, false);

                // Then
                const poolLength = await AllocationStaking.poolLength();
                const pool1 = await AllocationStaking.poolInfo(0);
                const pool2 = await AllocationStaking.poolInfo(1);

                expect(poolLength).to.equal(2);

                expect(pool1.lpToken).to.equal(BreLP1.address);
                expect(pool1.allocPoint).to.equal(ALLOC_POINT);
                expect(pool1.lastRewardTimestamp).to.equal(startTimestamp);
                expect(pool1.accERC20PerShare).to.equal(0);
                expect(pool1.totalDeposits).to.equal(0);

                expect(pool2.lpToken).to.equal(BreLP2.address);
                expect(pool2.allocPoint).to.equal(ALLOC_POINT);
                expect(pool2.lastRewardTimestamp).to.equal(startTimestamp);
                expect(pool2.accERC20PerShare).to.equal(0);
                expect(pool2.totalDeposits).to.equal(0);

                expect(await AllocationStaking.totalAllocPoint()).to.equal(2 * ALLOC_POINT);
            });

            it("Should not allow non-owner to add pool", async function () {
                // Then
                await expect(AllocationStaking.connect(alice).add(BreLP1.address))
                    .to.be.reverted;
            });
        });

        describe("Set allocation point", async function () {
            it("Should set pool's allocation point", async function () {
                // Given
                await baseSetup();
                const newAllocPoint = 12345;

                // When
                await AllocationStaking.set(0, newAllocPoint, false);

                // Then
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.allocPoint).to.equal(newAllocPoint);
                expect(await AllocationStaking.totalAllocPoint()).to.equal(newAllocPoint);
            });

            it("Should set pool's allocation point with mass update", async function () {
                // Given
                await baseSetup();
                const newAllocPoint = 12345;

                // When
                await AllocationStaking.set(0, newAllocPoint, true);

                // Then
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.allocPoint).to.equal(newAllocPoint);
                expect(await AllocationStaking.totalAllocPoint()).to.equal(newAllocPoint);
            });

            it("Should set pool's allocation point to 0", async function () {
                // Given
                await baseSetup();
                const newAllocPoint = 0;

                // When
                await AllocationStaking.set(0, newAllocPoint, false);

                // Then
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.allocPoint).to.equal(newAllocPoint);
                expect(await AllocationStaking.totalAllocPoint()).to.equal(newAllocPoint);
            });

            it("Should not allow non-owner to set allocation point", async function () {
                // Given
                await baseSetup();
                const newAllocPoint = 12345;

                // Then
                await expect(AllocationStaking.connect(alice).set(0, newAllocPoint, false))
                    .to.be.reverted;
            });
        })

        describe("Update pool", async function () {
            it("Should update pool", async function () {
                // Given
                await baseSetup();

                await BreLP1.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.updatePool(0);

                // Then
                let blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(blockTimestamp);
                const endTimestamp = await AllocationStaking.endTimestamp();
                if (blockTimestamp > endTimestamp) blockTimestamp = endTimestamp.deposited(0,)
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pool.accERC20PerShare).to.equal(expectedRewardsPerShare);
            });

            it("Should allow non-owner to update pool", async function () {
                // Given
                await baseSetup();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(AllocationStaking.connect(alice).updatePool(0))
                    .to.not.be.reverted;

                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(blockTimestamp);
            });

            it("Should update pool after staking ended", async function () {
                // Given
                await baseSetup();

                await BreLP1.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA + 1000]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.updatePool(0);

                // Then
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(startTimestamp + END_TIMESTAMP_DELTA);
                const expectedRewardsPerShare = computeExpectedReward(END_TIMESTAMP_DELTA, 0, REWARDS_PER_SECOND, ALLOC_POINT, ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pool.accERC20PerShare).to.equal(expectedRewardsPerShare);
            });

            it("Should not change pool if updated twice after end time", async function () {
                // Given
                await baseSetup();

                await BreLP1.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA + 1000]);
                await ethers.provider.send("evm_mine");

                await AllocationStaking.updatePool(0);

                // When
                await ethers.provider.send("evm_increaseTime", [100]);
                await ethers.provider.send("evm_mine");
                await AllocationStaking.updatePool(0);

                // Then
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(startTimestamp + END_TIMESTAMP_DELTA);
                const expectedRewardsPerShare = computeExpectedReward(END_TIMESTAMP_DELTA, 0, REWARDS_PER_SECOND, ALLOC_POINT, ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pool.accERC20PerShare).to.equal(expectedRewardsPerShare);
            });

            it("Should only change timestamp if pool is empty", async function () {
                // Given
                await baseSetup();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                const prevPoolInfo = await AllocationStaking.poolInfo(0);
                expect(prevPoolInfo.totalDeposits).to.equal(0);

                // When
                await AllocationStaking.updatePool(0);

                // Then
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(blockTimestamp);
                expect(pool.accERC20PerShare).to.equal(0);
            });
        });

        describe("Mass update pools", async function () {
            // TODO:
            xit("Should update all pools", async function () {
                // Given
                await baseSetup();

                await BreLP1.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await AllocationStaking.add(ALLOC_POINT, BreLP2.address, false);
                await BreLP2.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(1, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.massUpdatePools();

                // Then
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool1 = await AllocationStaking.poolInfo(0);
                const pool2 = await AllocationStaking.poolInfo(1);
                expect(pool1.lastRewardTimestamp).to.equal(blockTimestamp);
                expect(pool2.lastRewardTimestamp).to.equal(blockTimestamp);
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                console.log("Pool1 AccERC20:", parseInt(pool1.accERC20PerShare), "Expected AccERC20:", parseInt(expectedRewardsPerShare), "Pool2 AccERC20:", parseInt(pool2.accERC20PerShare));
                expect(pool1.accERC20PerShare).to.equal(expectedRewardsPerShare);
                expect(pool2.accERC20PerShare).to.equal(expectedRewardsPerShare);
            });

            it("Should allow non-owner to mass update pools", async function () {
                // Given
                await baseSetup();

                await BreLP1.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await AllocationStaking.add(ALLOC_POINT, BreLP2.address, false);
                await BreLP2.approve(AllocationStaking.address, DEFAULT_DEPOSIT);
                await AllocationStaking.deposit(1, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(AllocationStaking.connect(alice).massUpdatePools()).to.not.be.reverted;
            });

            it("Should not break if array of pools is empty", async function () {
                // Given
                await BreToken.approve(AllocationStaking.address, TOKENS_TO_ADD);
                await AllocationStaking.fund(TOKENS_TO_ADD);

                // Then
                await expect(AllocationStaking.connect(alice).massUpdatePools()).to.not.be.reverted;
            });
        });
    });

    context("Deposits", async function () {
        describe("Deposited", async function () {
            it("Should return user amount deposited in pool", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                const deposited = await AllocationStaking.deposited(0, deployer.address);
                expect(deposited).to.equal(DEFAULT_DEPOSIT);
            });

            it("Should return 0 if user not participated in pool", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                const deposited = await AllocationStaking.deposited(1, deployer.address);
                expect(deposited).to.equal(0);
            });
        })

        describe("Pending", async function () {
            it("Should return 0 if user deposited but staking not started", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                expect(pending).to.equal(0);
            });

            it("Should return 0 if user didn't deposit and staking not started", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                const pending = await AllocationStaking.pending(1, deployer.address);

                // Then
                expect(pending).to.equal(0);
            });

            it("Should return 0 if staking started but user didn't deposit", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const pending = await AllocationStaking.pending(1, deployer.address);

                // Then
                expect(pending).to.equal(0);
            });

            it("Should return user's pending amount if staking started and user deposited", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            it("Should return user's pending amount if called right after an update", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.updatePool(0);
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            it("Should return user's pending amount if called some time after an update", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.updatePool(0);

                await ethers.provider.send("evm_increaseTime", [20]);
                await ethers.provider.send("evm_mine");

                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            it("Should return user's last pending amount if user deposited multiple times", async function () {
                // Given
                await baseSetupTwoPools();
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.deposit(0, DEFAULT_DEPOSIT);
                const blockTimestampAtLastDeposit = await getCurrentBlockTimestamp();

                await ethers.provider.send("evm_increaseTime", [20]);
                await ethers.provider.send("evm_mine");

                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                // const expectedRewardsPerShare1 = computeExpectedReward(blockTimestampAtLastDeposit, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, 2 *DEFAULT_DEPOSIT);
                const expectedRewardsPerShare2 = computeExpectedReward(blockTimestamp, blockTimestampAtLastDeposit, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                // console.log(BigNumber.from(expectedRewardsPerShare2));

                const user = await AllocationStaking.userInfo(0, deployer.address);
                // console.log("User rewardDebt:", user.rewardDebt);

                // TODO: Check pending - sub 1
                expect(pending).to.equal(expectedRewardsPerShare2.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36).sub(1));
            });

            //TODO:
            xit("Should compute reward debt properly if user is not first to stake in pool", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.connect(alice).deposit(0, DEFAULT_DEPOSIT);
                const blockTimestampAtLastDeposit = await getCurrentBlockTimestamp();

                await ethers.provider.send("evm_increaseTime", [20]);
                await ethers.provider.send("evm_mine");

                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, alice.address);

                // Then
                const prevExpectedRewardsPerShare = computeExpectedReward(blockTimestampAtLastDeposit, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                const user = await AllocationStaking.userInfo(0, alice.address);
                console.log('a')
                // const firstRewardDebt =
                expect(user.rewardDebt).to.equal(prevExpectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36)/* + firstRewardDebt*/);
                console.log('a')

                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, blockTimestampAtLastDeposit, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, 2 * DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            //TODO:
            xit("Should compute reward debt properly if user is not first to stake in pool but staking not started", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await AllocationStaking.connect(alice).deposit(0, DEFAULT_DEPOSIT);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                const blockTimestamp = await getCurrentBlockTimestamp();
                const pending = await AllocationStaking.pending(0, alice.address);

                // Then
                const user = await AllocationStaking.userInfo(0, alice.address);
                expect(user.rewardDebt).to.equal(0)

                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, 2 * DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            it("Should not use updated accERC20PerShare if time passed but staking ended without pool update", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA + 100]);
                await ethers.provider.send("evm_mine");

                // When
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                const expectedRewardsPerShare = computeExpectedReward(END_TIMESTAMP_DELTA, 0, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });

            it("Should not use updated accERC20PerShare if time passed but staking ended with pool update", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA + 100]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.updatePool(0);
                const pending = await AllocationStaking.pending(0, deployer.address);

                // Then
                const expectedRewardsPerShare = computeExpectedReward(END_TIMESTAMP_DELTA, 0, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pending).to.equal(expectedRewardsPerShare.mul(DEFAULT_DEPOSIT).div(NUMBER_1E36));
            });
        });

        describe("Total pending", async function () {
            it("Should return total amount pending", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();

                // Then
                const expectedTotalPending = ethers.BigNumber.from(blockTimestamp).sub(startTimestamp).mul(REWARDS_PER_SECOND);
                expect(totalPending).to.equal(expectedTotalPending);
            });

            it("Should be sum of pending for each pool if multiple pools", async function () {
                // Given
                await baseSetupTwoPools();

                await AllocationStaking.deposit(1, 250);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();

                const pending0 = await AllocationStaking.pending(0, deployer.address);
                const pending1 = await AllocationStaking.pending(1, deployer.address);

                // Then
                const expectedTotalPending = pending0.add(pending1);
                // TODO: Recheck

                expect(totalPending).to.equal(expectedTotalPending);
            });

            it("Should be sum of pending for each user if multiple users", async function () {
                // Given
                await baseSetup();

                await BreLP1.connect(alice).approve(AllocationStaking.address, DEFAULT_LP_APPROVAL);
                await AllocationStaking.connect(alice).deposit(0, 250);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const totalPending = await AllocationStaking.totalPending();

                const pendingDeployer = await AllocationStaking.pending(0, deployer.address);
                const pendingAlice = await AllocationStaking.pending(0, alice.address);

                // Then
                const expectedTotalPending = pendingDeployer.add(pendingAlice);
                expect(totalPending).to.equal(expectedTotalPending);
            });

            //TODO:
            xit("Should be sum of pending for each pool and user if multiple pools and users", async function () {
                // Given
                await baseSetupTwoPools();

                await AllocationStaking.deposit(0, 100);
                await AllocationStaking.connect(alice).deposit(0, 250);
                await AllocationStaking.connect(alice).deposit(1, 2500);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await AllocationStaking.deposit(1, 250);

                await ethers.provider.send("evm_increaseTime", [100]);
                await ethers.provider.send("evm_mine");

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();

                const pendingDeployer0 = await AllocationStaking.pending(0, deployer.address);
                const pendingDeployer1 = await AllocationStaking.pending(1, deployer.address);
                const pendingAlice0 = await AllocationStaking.pending(0, alice.address);
                const pendingAlice1 = await AllocationStaking.pending(1, alice.address);

                // Then
                const expectedTotalPending = pendingDeployer0.add(pendingDeployer1).add(pendingAlice0).add(pendingAlice1);
                expect(totalPending).to.equal(expectedTotalPending.add(2));
            });

            it("Should return 0 if staking not started", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                const totalPending = await AllocationStaking.totalPending();

                // Then
                expect(totalPending).to.equal(0);
            });

            //TODO: check why 1 is a withdrawal leftover in many cases
            xit("Should return 0 if all pending tokens have been paid", async function () {
                // Given
                await baseSetupTwoPools();

                await AllocationStaking.deposit(1, 250);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await AllocationStaking.withdraw(0, Math.ceil(DEFAULT_DEPOSIT));
                await AllocationStaking.withdraw(1, Math.ceil(250));

                // When
                // const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();

                // Then
                expect(totalPending).to.equal(0);
            });

            xit("Should return 0 if all pending tokens have been wiped by emergency withdraw", async function () {
                // Given
                await baseSetupTwoPools();

                await AllocationStaking.deposit(1, 250);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                await AllocationStaking.emergencyWithdraw(0);
                await AllocationStaking.emergencyWithdraw(1);

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();

                // Then
                expect(totalPending).to.equal(0);
            });

            xit("Should return correct amount if one pool is empty", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                // When
                const blockTimestamp = await getCurrentBlockTimestamp();
                const totalPending = await AllocationStaking.totalPending();
                const pendingInPool0 = await AllocationStaking.pending(0, deployer.address);
                const pendingInPool1 = await AllocationStaking.pending(1, deployer.address);

                // Then
                expect(pendingInPool0).to.not.equal(0);
                expect(pendingInPool1).to.equal(0);

                expect(totalPending).to.equal(pendingInPool0);
            });
        });

        describe("Deposit", async function () {
            it("Should deposit LP tokens in pool if user is first to deposit", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await AllocationStaking.deposit(1, 250);

                // Then
                const pool = await AllocationStaking.poolInfo(1);
                const user = await AllocationStaking.userInfo(1, deployer.address);
                console.log(user);
                expect(pool.totalDeposits).to.equal(250);
                expect(user.amount).to.equal(250);
            });

            it("Should deposit LP tokens in pool if user is already deposited in this pool", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await AllocationStaking.deposit(0, 250);

                // Then
                const pool = await AllocationStaking.poolInfo(0);
                const user = await AllocationStaking.userInfo(0, deployer.address);
                expect(pool.totalDeposits).to.equal(DEFAULT_DEPOSIT + 250);
                expect(user.amount).to.equal(DEFAULT_DEPOSIT + 250);
            });

            it("Should deposit LP tokens in pool if user is second to deposit", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await AllocationStaking.deposit(1, 250);
                await AllocationStaking.connect(alice).deposit(1, 300);

                // Then
                const pool = await AllocationStaking.poolInfo(1);
                const user = await AllocationStaking.userInfo(1, alice.address);
                expect(pool.totalDeposits).to.equal(250 + 300);
                expect(user.amount).to.equal(300);
            });

            //TODO:
            xit("Should update pool before adding LP tokens", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.deposit(0, 100);

                // Then
                const blockTimestamp = await getCurrentBlockTimestamp();
                const pool = await AllocationStaking.poolInfo(0);
                expect(pool.lastRewardTimestamp).to.equal(blockTimestamp);
                const expectedRewardsPerShare = computeExpectedReward(blockTimestamp, startTimestamp, REWARDS_PER_SECOND, ALLOC_POINT, 2 * ALLOC_POINT, DEFAULT_DEPOSIT);
                expect(pool.accERC20PerShare).to.equal(expectedRewardsPerShare);
                expect(pool.totalDeposits).to.equal(DEFAULT_DEPOSIT + 100);
            });

            it("Should not deposit into non-existent pool", async function () {
                // Given
                await baseSetupTwoPools();

                // Then
                await expect(AllocationStaking.deposit(5, 100)).to.be.reverted;
            });

            //TODO:
            xit("Should pay user pending amount before adding new deposit", async function () {
                // Given
                await baseSetupTwoPools();

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                const pendingBefore = await AllocationStaking.pending(0, deployer.address);
                const balanceLPBefore = await BreLP1.balanceOf(deployer.address);
                const balanceERC20Before = await BreToken.balanceOf(deployer.address);

                // When
                await AllocationStaking.deposit(0, 100);

                // Then
                const pendingAfter = await AllocationStaking.pending(0, deployer.address);
                const balanceLPAfter = await BreLP1.balanceOf(deployer.address);
                const balanceERC20After = await BreToken.balanceOf(deployer.address);

                expect(pendingAfter).to.equal(0);
                expect(balanceLPAfter).to.equal(balanceLPBefore.sub(100));
                expect(balanceERC20After).to.equal(balanceERC20Before.add(pendingBefore));
            });

            it("Should emit Deposit event", async function () {
                // Given
                await baseSetupTwoPools();

                // Then
                await expect(AllocationStaking.deposit(0, DEFAULT_DEPOSIT))
                    .to.emit(AllocationStaking, "Deposit").withArgs(deployer.address, 0, DEFAULT_DEPOSIT);
            });
        });

    });

    context("Withdraws", async function () {
        describe("Withdraw", async function () {
            it("Should withdraw user's deposit", async function () {
                // Given
                await baseSetupTwoPools();
                const poolBefore = await AllocationStaking.poolInfo(0);
                const balanceBefore = await BreLP1.balanceOf(deployer.address);

                // When
                await AllocationStaking.withdraw(0, DEFAULT_DEPOSIT);

                // Then
                const poolAfter = await AllocationStaking.poolInfo(0)
                const balanceAfter = await BreLP1.balanceOf(deployer.address);
                expect(balanceAfter).to.equal(balanceBefore.add(DEFAULT_DEPOSIT));
                expect(poolBefore.totalDeposits).to.equal(DEFAULT_DEPOSIT);
                expect(poolAfter.totalDeposits).to.equal(0);
            });

            it("Should withdraw part of user's deposit", async function () {
                // Given
                await baseSetupTwoPools();
                const balanceBefore = await BreLP1.balanceOf(deployer.address);

                // When
                await AllocationStaking.withdraw(0, DEFAULT_DEPOSIT / 2);

                // Then
                const balanceAfter = await BreLP1.balanceOf(deployer.address);
                expect(balanceAfter).to.equal(balanceBefore.add(DEFAULT_DEPOSIT / 2));
            });

            it("Should not withdraw more than user's deposit", async function () {
                // Given
                await baseSetupTwoPools();

                // Then
                await expect(AllocationStaking.withdraw(0, DEFAULT_DEPOSIT * 2)).to.be.revertedWith("withdraw: can't withdraw more than deposit");
            });

            it("Should transfer user's ERC20 share", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                const pendingBefore = await AllocationStaking.pending(0, deployer.address);
                const balanceERC20Before = await BreToken.balanceOf(deployer.address);

                await AllocationStaking.withdraw(0, DEFAULT_DEPOSIT);

                // Then
                const pendingAfter = await AllocationStaking.pending(0, deployer.address);
                const balanceERC20After = await BreToken.balanceOf(deployer.address);

                expect(balanceERC20After).to.equal(balanceERC20Before.add(pendingBefore));
                expect(pendingAfter).to.equal(0);
                expect(await AllocationStaking.paidOut()).to.equal(pendingBefore);
            });

            it("Should emit Withdraw event", async function () {
                // Given
                await baseSetupTwoPools();

                // Then
                await expect(AllocationStaking.withdraw(0, DEFAULT_DEPOSIT))
                    .to.emit(AllocationStaking, "Withdraw").withArgs(deployer.address, 0, DEFAULT_DEPOSIT);
            });


        });
        describe("emergencyWithdraw", async function () {
            it("Should withdraw user's deposit only", async function () {
                // Given
                await baseSetupTwoPools();
                const balanceLPBefore = await BreLP1.balanceOf(deployer.address);
                const balanceERC20Before = await BreToken.balanceOf(deployer.address);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");


                // When
                await AllocationStaking.emergencyWithdraw(0);

                // Then
                const balanceLPAfter = await BreLP1.balanceOf(deployer.address);
                const balanceERC20After = await BreToken.balanceOf(deployer.address);
                expect(balanceLPAfter).to.equal(balanceLPBefore.add(DEFAULT_DEPOSIT));
                expect(balanceERC20After).to.equal(balanceERC20Before);
            });

            it("Should update pool's total deposit", async function () {
                // Given
                await baseSetupTwoPools();
                const poolBefore = await AllocationStaking.poolInfo(0);

                await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 50]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [END_TIMESTAMP_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await AllocationStaking.emergencyWithdraw(0);

                // Then
                const poolAfter = await AllocationStaking.poolInfo(0)
                expect(poolBefore.totalDeposits).to.equal(DEFAULT_DEPOSIT);
                expect(poolAfter.totalDeposits).to.equal(0);
            });

            it("Should emit EmergencyWithdraw event", async function () {
                // Given
                await baseSetupTwoPools();

                // Then
                await expect(AllocationStaking.emergencyWithdraw(0))
                    .to.emit(AllocationStaking, "EmergencyWithdraw").withArgs(deployer.address, 0, DEFAULT_DEPOSIT);
            });

            it("Should reset user's amount and debt to 0", async function () {
                // Given
                await baseSetupTwoPools();

                // When
                await AllocationStaking.emergencyWithdraw(0);

                // Then
                const user = await AllocationStaking.userInfo(0, deployer.address);
                expect(user.amount).to.equal(0);
                expect(user.rewardDebt).to.equal(0);
            });
        });
    })

    describe("Compound", function () {
        it("Should compound", async function() {
            // Given
            await baseSetupTwoPools();

            await ethers.provider.send("evm_increaseTime", [START_TIMESTAMP_DELTA + 10]);
            await ethers.provider.send("evm_mine");

            const userInfo = await AllocationStaking.userInfo(0, deployer.address);
            // console.log(BigInt(userInfo[0]))
            //
            // console.log(BigInt(parseInt(await AllocationStaking.pending("0", deployer.address))));

            expect(await AllocationStaking.compound(0)).to.emit(AllocationStaking, "CompoundedEarnings");
        });
    });

});
