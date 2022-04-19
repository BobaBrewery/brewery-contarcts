const {ethers} = require("hardhat");
const {expect} = require("chai");
const ethUtil = require("ethereumjs-util")
const {BigNumber} = require("ethers");

describe("BreweryNFTSale", function () {

    let Admin;
    let BreweryNFTMinter;
    let nft;
    let minter;
    let deployer, signer, user;
    let AllocationStakingRewardsFactory;
    let startTimestamp;
    let ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
    let ONE_ADDRESS = "0x0000000000000000000000000000000000000001";

    // nft variable

    let counter = 2000;
    // 0.1 eth
    let ethAmount = ethers.utils.parseUnits("0.1");

    // const

    const TIME_DELTA = 10;
    const MINT_ROLE_BYTES32 = "0x3a5b873628a2c49bf313473942acc8932f6f84c76b74bf3db0e4d8b51277a623"

    let vestingPortionsUnlockTime = [];
    let vestingPercentPerPortion = [];

    const DECIMALS = 18; // Working with non-18 decimals
    const MULTIPLIER = (10 ** DECIMALS).toString();
    const REV = (10 ** (18 - DECIMALS)).toString();

    const REWARDS_PER_SECOND = ethers.utils.parseUnits("0.1");
    const START_TIMESTAMP_DELTA = 600;
    const NUMBER_1E36 = "1000000000000000000000000000000000000";
    const NUMBER_1E18 = "1000000000000000000";

    const TOKEN_PRICE_IN_PT = 1e11;
    // const AMOUNT_OF_TOKENS_TO_SELL = 100 * NUMBER_1E18 * (NUMBER_1E18 / TOKEN_PRICE_IN_PT) * REV;
    const AMOUNT_OF_TOKENS_TO_SELL = BigNumber.from(100000000).mul(NUMBER_1E18);
    const PORTION_VESTING_PRECISION = 100;
    const SALE_START_DELTA = 50;
    const MAX_PARTICIPATION = BigNumber.from(10000000).mul(NUMBER_1E18).mul(REV)
    const PARTICIPATION_AMOUNT = BigNumber.from(10000000).mul(NUMBER_1E18).mul(REV);
    const PARTICIPATION_VALUE = BigNumber.from(1).mul(NUMBER_1E18).mul(REV);

    const DEPLOYER_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    function firstOrDefault(first, key, def) {
        if (first && first[key] !== undefined) {
            return first[key];
        }
        return def;
    }

    function generateSignature(digest, privateKey) {
        // prefix with "\x19Ethereum Signed Message:\n32"
        // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/issues/890
        const prefixedHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(digest));

        // sign message
        const {v, r, s} = ethUtil.ecsign(prefixedHash, Buffer.from(privateKey, 'hex'))

        // generate signature by concatenating r(32), s(32), v(1) in this order
        // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/76fe1548aee183dfcc395364f0745fe153a56141/contracts/ECRecovery.sol#L39-L43
        const vb = Buffer.from([v]);
        const signature = Buffer.concat([r, s, vb]);

        return signature;
    }

    function signRegistration(userAddress, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, address(this)))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address'], [userAddress, contractAddress]));

        return generateSignature(digest, privateKey);
    }

    function signVoucher(userAddress, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, address(this))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address', 'string'], [userAddress, contractAddress, 'voucher']));

        return generateSignature(digest, privateKey);
    }

    function signParticipation(userAddress, amount, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, amount))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'address'], [userAddress, amount, contractAddress]));

        return generateSignature(digest, privateKey);
    }

    function participate(params) {
        const registrant = firstOrDefault(params, 'sender', deployer);

        const userAddress = registrant.address;
        const participationAmount = firstOrDefault(params, 'participationAmount', PARTICIPATION_AMOUNT);
        const paymentAmount = firstOrDefault(params, "participationValue", PARTICIPATION_VALUE);
        // console.log(participationAmount, value);
        const sig = signParticipation(userAddress, participationAmount, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY); // backend signature
        return BreweryNFTMinter.connect(registrant).participate(sig, participationAmount, paymentAmount);   // contract
    }

    async function getCurrentBlockTimestamp() {
        return (await ethers.provider.getBlock('latest')).timestamp;
    }

    async function runFullSetupNoDeposit(params) {
        await setSaleParams(params);
        await setRegistrationTime(params);
        await setSaleStart(params);
    }

    async function runFullSetup(params) {
        await setSaleParams(params);
        await setRegistrationTime(params);
        await setSaleStart(params)
        await depositTokens();
    }

    async function registerForSale(params) {
        const registrant = firstOrDefault(params, 'sender', deployer);

        const sig = signRegistration(registrant.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

        await BreweryNFTMinter.connect(registrant).registerForSale(sig, 0);
    }

    beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        signer = accounts[1];
        user = accounts[2];

        const MedievalNFT = await ethers.getContractFactory("MedievalNFT");
        nft = await MedievalNFT.deploy();

        const AdminFactory = await ethers.getContractFactory("Admin");
        Admin = await AdminFactory.deploy([deployer.address, signer.address]);

        const BreweryNFTMinter = await ethers.getContractFactory("NFTMinter");
        minter = await BreweryNFTMinter.deploy(Admin.address, nft.address);

        // set eth price & sale amount
        await minter.setPrice(ethAmount, counter);

        //    set minter role
        await nft.grantRole(MINT_ROLE_BYTES32, minter.address);

    })


    context("setup", async function () {
        it('should  setup the admin correctly', async function () {
            // Given
            let admin = await minter.admin();

            // Then
            expect(admin).to.equal(Admin.address);
        });

        it("should set nft price and count correctly", async function () {
            let minterPrice = await minter.ethAmount();
            let minterCounter = await minter.counter();
            expect(minterPrice).to.equal(ethAmount);
            expect(minterCounter).to.equal(counter);
        })

    });

    context("Voucher", async function () {
        it("Should buy 1 nft for free", async function () {
            expect((await minter.numberOfVoucher())).to.equal(0);

            const sig = signVoucher(deployer.address, minter.address, DEPLOYER_PRIVATE_KEY);

            await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
            await ethers.provider.send("evm_mine");

            await minter.mintWithVoucher(sig);

            expect((await minter.numberOfVoucher())).to.equal(1);
        })

        it("Should buy nft only once", async function () {
            expect((await minter.numberOfVoucher())).to.equal(0);

            const sig = signVoucher(deployer.address, minter.address, DEPLOYER_PRIVATE_KEY);

            await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
            await ethers.provider.send("evm_mine");

            await minter.mintWithVoucher(sig);

            expect((await minter.numberOfVoucher())).to.equal(1);

            await expect(minter.mintWithVoucher(sig))
                .to.be.revertedWith("User can participate only once.");
        })
    })

    context("Registration", async function () {
        describe("Register for sale", async function () {
            it("Should register for sale", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await BreweryNFTMinter.registerForSale(sig, 0);

                // Then
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(1);
            });

            it("Should not register after registration ends", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // When
                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_ENDS_DELTA + 1]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.registerForSale(sig, 0))
                    .to.be.revertedWith("Registration gate is closed.");
            });

            it("Should not register before registration starts", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(BreweryNFTMinter.registerForSale(sig, 0))
                    .to.be.revertedWith("Registration gate is closed.");
            });

            it("Should not register if signature invalid", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(alice.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.registerForSale(sig, 0))
                    .to.be.revertedWith("Invalid signature");
            });

            it("Should not register twice", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await BreweryNFTMinter.registerForSale(sig, 0);

                // Then
                await expect(BreweryNFTMinter.registerForSale(sig, 0))
                    .to.be.revertedWith("User can not register twice.");
            });

            it("Should emit UserRegistered event", async function () {
                // Given
                await runFullSetup();
                expect((await BreweryNFTMinter.registration()).numberOfRegistrants).to.equal(0);

                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.registerForSale(sig, 0))
                    .to.emit(BreweryNFTMinter, "UserRegistered").withArgs(deployer.address);
            });
        });

        // Deprecated getter function tests
        xdescribe("Get registration info", async function () {
            it("Should return registration info when sale not set", async function () {
                // When
                const regInfo = await BreweryNFTMinter.getRegistrationInfo();

                // Then
                expect(regInfo[0]).to.equal(0);
                expect(regInfo[1]).to.equal(0);
            });

            it("Should return initial registration info", async function () {
                // Given
                const blockTimestamp = getCurrentBlockTimestamp();
                await runFullSetup();

                // When
                const regInfo = await BreweryNFTMinter.getRegistrationInfo();

                // Then
                const registrationTimeEnds = (await BreweryNFTMinter.registration()).registrationTimeEnds;
                expect(regInfo[0]).to.equal(registrationTimeEnds);
                expect(regInfo[1]).to.equal(0);
            });

            it("Should return updated registration info after users registered", async function () {
                // Given
                await runFullSetup();
                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await registerForSale();

                // Then
                const regInfo = await BreweryNFTMinter.getRegistrationInfo();
                expect(regInfo[1]).to.equal(1);
            });

            it("Should return updated registration info after registration extended", async function () {
                // Given
                await runFullSetup();

                // When
                const timeToAdd = 10;
                await BreweryNFTMinter.extendRegistrationPeriod(timeToAdd);

                // Then
                const regInfo = await BreweryNFTMinter.getRegistrationInfo();
                const registrationTimeEnds = (await BreweryNFTMinter.registration()).registrationTimeEnds;
                expect(regInfo[0]).to.equal(registrationTimeEnds);
            });
        });
    });

    context("Signature validation", async function () {
        describe("Check registration signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signRegistration(alice.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signRegistration(deployer.address, BreToken.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(BreweryNFTMinter.checkRegistrationSignature(sig.slice(1), deployer.address)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer is sale owner and not admin", async function () {
                // Given
                await runFullSetup();
                await Admin.removeAdmin(deployer.address);
                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.false;
            });

            it("Should fail if signer is neither sale owner nor admin", async function () {
                // Given
                await runFullSetupNoDeposit({saleOwner: alice.address});
                await Admin.removeAdmin(deployer.address);
                const sig = signRegistration(deployer.address, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address'], [deployer.address, BreweryNFTMinter.address]));
                const {v, r, s} = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await BreweryNFTMinter.checkRegistrationSignature(sig, deployer.address)).to.be.false;
            });
        });

        describe("Check participation signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signParticipation(deployer.address, 100, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signParticipation(alice.address, 100, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });

            it("Should fail if signature is for a different amount", async function () {
                // Given
                const sig = signParticipation(deployer.address, 200, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signParticipation(deployer.address, 100, BreToken.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signParticipation(deployer.address, 100, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(BreweryNFTMinter.checkParticipationSignature(sig.slice(1), deployer.address, 100)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer is sale owner and not admin", async function () {
                // Given
                await runFullSetup();
                await Admin.removeAdmin(deployer.address);
                const sig = signParticipation(deployer.address, 100, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });

            it("Should fail if signer is neither sale owner nor admin", async function () {
                // Given
                await runFullSetupNoDeposit({saleOwner: alice.address});
                await Admin.removeAdmin(deployer.address);
                const sig = signParticipation(deployer.address, 100, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256'], [deployer.address, 100]));
                const {v, r, s} = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await BreweryNFTMinter.checkParticipationSignature(sig, deployer.address, 100)).to.be.false;
            });
        });
    });

    context("Participation", async function () {
        describe("Participate", async function () {
            it("Should allow user to participate", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await BreToken.approve(AllocationStaking.address, "50000000");
                await AllocationStaking.deposit(0, "50000000");

                // When
                await participate();

                // Then
                const sale = await BreweryNFTMinter.sale();
                const isParticipated = await BreweryNFTMinter.isParticipated(deployer.address);
                const participation = await BreweryNFTMinter.getParticipation(deployer.address);

                expect(sale.totalTokensSold).to.equal(PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));
                expect(sale.totalPTRaised).to.equal(PARTICIPATION_VALUE);
                expect(isParticipated).to.be.true;
                expect(participation[0]).to.equal(PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));

                expect(await BreweryNFTMinter.getNumberOfRegisteredUsers()).to.equal(1);
            });

            it("Should allow multiple users to participate", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await participate();
                await participate({sender: alice});

                // Then
                const sale = await BreweryNFTMinter.sale();
                const isParticipatedDeployer = await BreweryNFTMinter.isParticipated(deployer.address);
                const isParticipatedAlice = await BreweryNFTMinter.isParticipated(alice.address);
                const participationDeployer = await BreweryNFTMinter.userToParticipation(deployer.address);
                const participationAlice = await BreweryNFTMinter.userToParticipation(alice.address);

                expect(sale.totalTokensSold).to.equal(PARTICIPATION_VALUE.mul(2).div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));
                expect(sale.totalPTRaised).to.equal(BigNumber.from(PARTICIPATION_VALUE).mul(2));
                expect(isParticipatedDeployer).to.be.true;
                expect(isParticipatedAlice).to.be.true;
                // todo buy token price?
                expect(participationDeployer.amountBought).to.equal(PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));
                expect(participationAlice.amountBought).to.equal(PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));
            });

            it("Should not participate with amount larger than maxParticipation", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate({participationAmount: MAX_PARTICIPATION + 1}))
                    .to.be.revertedWith("Overflowing maximal participation for sale.");
            });

            it("Should not participate with invalid signature", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                const sig = signParticipation(alice.address, PARTICIPATION_AMOUNT, BreweryNFTMinter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(BreweryNFTMinter.participate(sig, PARTICIPATION_AMOUNT, PARTICIPATION_VALUE))
                    .to.be.revertedWith("Invalid signature. Verification failed");
            })

            it("Should not participate twice", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();

                // Then
                await expect(participate())
                    .to.be.revertedWith("User can participate only once.");
            });

            it("Should not participate in a sale that ended", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate())
                    .to.be.revertedWith("sale didn't start or it's ended.");
            });

            it("Should not participate in a round that has not started", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                // Then
                await expect(participate())
                    .to.be.revertedWith("sale didn't start or it's ended.");
            });

            it("Should not buy more than allowed", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate({participationValue: (PARTICIPATION_VALUE.add(1))})).to.be.revertedWith("Trying to buy more than allowed.");
            });

            it("Should emit TokensSold event", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate()).to.emit(BreweryNFTMinter, "TokensSold").withArgs(deployer.address, PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(MULTIPLIER));
            });

            it("Should not participate without registering for the round", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate()).to.be.revertedWith("Not registered for this sale.");
            });

            it("Should fail if buying 0 tokens", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(participate({participationValue: 0})).to.be.reverted;
            });
        });

        describe("Withdraw tokens", async function () {
            it("Should withdraw user's tokens", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await setVestingParams();

                const vestingParams = await BreweryNFTMinter.getVestingInfo();
                expect(vestingParams[0][0]).to.equal(vestingPortionsUnlockTime[0]);
                expect(vestingParams[0][1]).to.equal(vestingPortionsUnlockTime[1]);
                expect(vestingParams[1][0]).to.equal(vestingPercentPerPortion[0]);
                expect(vestingParams[1][1]).to.equal(vestingPercentPerPortion[1]);

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();

                await ethers.provider.send("evm_increaseTime", [TOKENS_UNLOCK_TIME_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                // console.log(await BreweryNFTSale.getParticipation(deployer.address));

                await BreToken.transfer(BreweryNFTMinter.address, "10000000000000000000");
                const previousBalance = BigNumber.from(await BreToken.balanceOf(deployer.address));
                // console.log(previousBalance)

                // When
                await BreweryNFTMinter.withdrawTokens(0);

                // Then
                const currentBalance = BigNumber.from(await BreToken.balanceOf(deployer.address));
                // console.log(currentBalance)
                const withdrawAmount = PARTICIPATION_VALUE.mul(MULTIPLIER).div(TOKEN_PRICE_IN_PT).mul(5).div(PORTION_VESTING_PRECISION);
                // console.log(withdrawAmount)
                expect(currentBalance).to.equal(previousBalance.add(withdrawAmount));
            });

            it("Should withdraw user's tokens using multiple portion withdrawal", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await setVestingParams();

                const vestingParams = await BreweryNFTMinter.getVestingInfo();
                expect(vestingParams[0][0]).to.equal(vestingPortionsUnlockTime[0]);
                expect(vestingParams[0][1]).to.equal(vestingPortionsUnlockTime[1]);
                expect(vestingParams[1][0]).to.equal(vestingPercentPerPortion[0]);
                expect(vestingParams[1][1]).to.equal(vestingPercentPerPortion[1]);

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();

                await ethers.provider.send("evm_increaseTime", [TOKENS_UNLOCK_TIME_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                // console.log(await BreweryNFTSale.getParticipation(deployer.address));

                await BreToken.transfer(BreweryNFTMinter.address, "10000000000000000000");
                const previousBalance = BigNumber.from(await BreToken.balanceOf(deployer.address));

                // When
                await BreweryNFTMinter.withdrawMultiplePortions([0, 1]);

                // Then
                const currentBalance = BigNumber.from(await BreToken.balanceOf(deployer.address));
                // console.log(parseInt(currentBalance))
                const withdrawAmount = PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(100).div(PORTION_VESTING_PRECISION).mul(MULTIPLIER);
                // console.log(withdrawAmount)
                expect(currentBalance).to.equal(previousBalance.add(withdrawAmount));
            })

            it("Should not withdraw twice", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await setVestingParams();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();

                await ethers.provider.send("evm_increaseTime", [TOKENS_UNLOCK_TIME_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                await BreToken.transfer(BreweryNFTMinter.address, "10000000000000000000");
                await BreweryNFTMinter.withdrawTokens(0);

                // Then
                await expect(BreweryNFTMinter.withdrawTokens(0)).to.be.revertedWith("Tokens already withdrawn or portion not unlocked yet.");
            });

            it("Should not withdraw before tokens unlock time", async function () {
                // Given
                await runFullSetup();

                await setVestingParams();
                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();

                // Then
                await expect(BreweryNFTMinter.withdrawTokens(0)).to.be.revertedWith("Tokens can not be withdrawn yet.");
            });

            it("Should emit TokensWithdrawn event", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await setVestingParams();

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate();
                await BreToken.transfer(BreweryNFTMinter.address, "10000000000000000000");

                await ethers.provider.send("evm_increaseTime", [TOKENS_UNLOCK_TIME_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.withdrawTokens(0)).to.emit(BreweryNFTMinter, "TokensWithdrawn").withArgs(deployer.address, PARTICIPATION_VALUE.div(TOKEN_PRICE_IN_PT).mul(5).div(PORTION_VESTING_PRECISION).mul(MULTIPLIER));
            });

            it("Should shift westing unclock times", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale();
                await setVestingParams();

                const shift = 10;
                await BreweryNFTMinter.shiftVestingUnlockingTimes(shift);

                const vestingParams = await BreweryNFTMinter.getVestingInfo();
                expect(vestingParams[0][0]).to.equal(vestingPortionsUnlockTime[0] + shift);
                expect(vestingParams[0][1]).to.equal(vestingPortionsUnlockTime[1] + shift);
            });
        });

        describe("Withdraw earnings and leftover", async function () {
            xit("Should withdraw sale owner's earnings and leftovers", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                const sale = await BreweryNFTMinter.sale();
                console.log(parseInt(sale.amountOfTokensToSell), parseInt(sale.totalTokensSold));

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA]);
                await ethers.provider.send("evm_mine");

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);

                expect(currentBalance).to.equal(previousBalance.add(PARTICIPATION_VALUE));
                expect(currentTokenBalance).to.equal(previousTokenBalance.add((AMOUNT_OF_TOKENS_TO_SELL - PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT)));
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT);
            });

            it("Should not withdraw twice", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                await expect(BreweryNFTMinter.withdrawEarningsAndLeftover()).to.be.reverted;
            });

            it("Should not withdraw before sale ended", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - SALE_START_DELTA - 15]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.withdrawEarningsAndLeftover()).to.be.reverted;
            });

            it("Should not allow non-sale owner to withdraw", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_START_DELTA - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - SALE_START_DELTA]);
                await ethers.provider.send("evm_mine");

                // Then
                await expect(BreweryNFTMinter.connect(bob).withdrawEarningsAndLeftover()).to.be.revertedWith("OnlySaleOwner:: Restricted");
            });

            //TODO:
            xit("Should burn leftover if requested", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [ROUNDS_START_DELTAS[0] - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - ROUNDS_START_DELTAS[0]]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);
                const burnedTokenBalance = await BreToken.balanceOf(ONE_ADDRESS);

                expect(currentBalance).to.equal(previousBalance.add(PARTICIPATION_VALUE));
                expect(currentTokenBalance).to.equal(previousTokenBalance);
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT);
                expect(burnedTokenBalance).to.equal(AMOUNT_OF_TOKENS_TO_SELL - PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT);
            });

            //TODO:
            xit("Should not crash if leftover is 0", async function () {
                // Given
                await runFullSetup({amountOfTokensToSell: Math.floor(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT * MULTIPLIER)});

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [ROUNDS_START_DELTAS[0] - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - ROUNDS_START_DELTAS[0]]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);

                expect(currentBalance).to.equal(previousBalance.add(PARTICIPATION_VALUE));
                expect(currentTokenBalance).to.equal(previousTokenBalance);
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT * MULTIPLIER);
            });

            //TODO:
            xit("Should not crash if leftover is 0 and burn is requested", async function () {
                // Given
                await runFullSetup({amountOfTokensToSell: Math.floor(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT * MULTIPLIER)});

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await registerForSale({sender: alice});

                await ethers.provider.send("evm_increaseTime", [ROUNDS_START_DELTAS[0] - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await participate({sender: alice});

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - ROUNDS_START_DELTAS[0]]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);
                const burnedTokenBalance = await BreToken.balanceOf(ONE_ADDRESS);

                expect(currentBalance).to.equal(previousBalance.add(PARTICIPATION_VALUE));
                expect(currentTokenBalance).to.equal(previousTokenBalance);
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(PARTICIPATION_VALUE / TOKEN_PRICE_IN_PT * MULTIPLIER);
                expect(burnedTokenBalance).to.equal(0);
            });

            //TODO:
            xit("Should not crash if earnings are 0", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [ROUNDS_START_DELTAS[0] - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - ROUNDS_START_DELTAS[0]]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);

                expect(currentBalance).to.equal(previousBalance);
                expect(currentTokenBalance).to.equal(previousTokenBalance.add(AMOUNT_OF_TOKENS_TO_SELL));
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(0);
            });

            //TODO:
            xit("Should not crash if earnings are 0 and burn is requested", async function () {
                // Given
                await runFullSetup();

                await ethers.provider.send("evm_increaseTime", [REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [ROUNDS_START_DELTAS[0] - REGISTRATION_TIME_STARTS_DELTA]);
                await ethers.provider.send("evm_mine");

                await ethers.provider.send("evm_increaseTime", [SALE_END_DELTA - ROUNDS_START_DELTAS[0]]);
                await ethers.provider.send("evm_mine");

                const previousBalance = await ethers.provider.getBalance(deployer.address);
                const previousTokenBalance = await BreToken.balanceOf(deployer.address);

                // When
                await BreweryNFTMinter.withdrawEarningsAndLeftover();

                // Then
                const currentBalance = await ethers.provider.getBalance(deployer.address);
                const contractBalance = await ethers.provider.getBalance(BreweryNFTMinter.address);
                const currentTokenBalance = await BreToken.balanceOf(deployer.address);
                const contractTokenBalance = await BreToken.balanceOf(BreweryNFTMinter.address);
                const burnedTokenBalance = await BreToken.balanceOf(ONE_ADDRESS);

                expect(currentBalance).to.equal(previousBalance);
                expect(currentTokenBalance).to.equal(previousTokenBalance);
                expect(contractBalance).to.equal(0);
                expect(contractTokenBalance).to.equal(0);
                expect(burnedTokenBalance).to.equal(AMOUNT_OF_TOKENS_TO_SELL);
            });
        });

    });
});
