const {ethers} = require("hardhat");
const {expect, use} = require("chai");
const ethUtil = require("ethereumjs-util")
const {BigNumber} = require("ethers");
const hre = require("hardhat");

describe("WhiteListNFTSale", function () {

    let Admin;
    let token;
    let minter;
    let deployer, signer, user, user2;

    // price = 10 u
    let price = ethers.utils.parseUnits("10");

    // const
    const TIME_DELTA = 10;

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


    function signMint(userAddress, price, amount, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, amount))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'address'], [userAddress, price, amount, contractAddress]));

        return generateSignature(digest, privateKey);
    }

    beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        signer = accounts[1];
        user = accounts[2];
        user2 = accounts[3];

        const tokenName = "MOCK-USDT";
        const symbol = "MCK";
        const totalSupply = "1000000000000000000000000000";
        const decimals = 18;

        const MCK = await hre.ethers.getContractFactory("BreToken");
        token = await MCK.deploy(tokenName, symbol, totalSupply, decimals);
        await token.deployed();


        const AdminFactory = await ethers.getContractFactory("Admin");
        Admin = await AdminFactory.deploy([deployer.address, signer.address]);

        const WLMinter = await ethers.getContractFactory("WLMinter");
        minter = await WLMinter.deploy(Admin.address, token.address);

        //    approve token to minter
        await token.connect(user).approve(minter.address, totalSupply);

    })


    context("setup", async function () {
        it('should  setup the admin correctly', async function () {
            // Given
            let admin = await minter.admin();

            // Then
            expect(admin).to.equal(Admin.address);
        });

        it("should set mock usdt address correctly", async function () {
            let usdt = await minter.USDT();
            console.log('usdt,', usdt)
            expect(usdt).to.equal(token.address);
        })

        it("should set counter to 0", async function () {
            let minterCounter = await minter.counter();
            expect(minterCounter).to.equal(0);
        })

    });

    context("Signature validation", async function () {
        describe("check whitelist signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signMint(user2.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });

            it("Should fail if signature is for a different price", async function () {
                // Given
                const sig = signMint(user.address, price.mul(2), 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });

            it("Should fail if signature is for a different amount", async function () {
                // Given
                const sig = signMint(user.address, price.mul(2), 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price.mul(2), 1)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signMint(user.address, price, 2, token.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(minter.checkMintSignature(sig.slice(1), user.address, price, 2)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(minter.checkMintSignature(sig, user.address, price, 2)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer not admin", async function () {
                // Given
                await Admin.removeAdmin(deployer.address);
                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'address'], [user.address, price, 2, minter.address]));
                const {v, r, s} = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });
        });
    });

    context("whitelist", async function () {
        describe("Whitelist Mint", async function () {
            it("should mint 1 succeed", async function () {
                // Given
                expect(await token.balanceOf(minter.address)).to.equal(0);
                await token.transfer(user.address, price);

                const sig = signMint(user.address, price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(1, price, sig);

                // Then
                expect(await minter.counter()).to.equal(1);
                expect(await token.balanceOf(minter.address)).to.equal(price);
                expect(await token.balanceOf(user.address)).to.equal(0);
            });
            it('should mint 2 succeed', async function () {

                // Given
                expect(await token.balanceOf(minter.address)).to.equal(0);
                await token.transfer(user.address, price.mul("2"));

                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, price, sig);

                // Then
                expect(await minter.counter()).to.equal(2);
                expect(await token.balanceOf(minter.address)).to.equal(price.mul("2"));
                expect(await token.balanceOf(user.address)).to.equal(0);
            });

            it('should get user bought number', async function () {

                // Given
                await token.transfer(user.address, price.mul("2"));

                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, price, sig);

                // Then
                expect(await minter.saleParticipated(user.address)).to.equal(2);
            });
        });
    });

    context("Withdraw", async function () {
        describe("Withdraw Earnings", async function () {
            it("should withdraw earnings", async function () {
                // Given
                await token.transfer(user.address, price.mul("2"));

                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, price, sig);

                expect(await token.balanceOf(minter.address)).to.equal(price.mul("2"));

                await minter.withdrawEarnings(price.mul("2"));
                expect(await token.balanceOf(minter.address)).to.equal(0);
            });

            it("should not withdraw if not an administrator", async function () {
                // Given
                await token.transfer(user.address, price.mul("2"));

                const sig = signMint(user.address, price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, price, sig);

                expect(await token.balanceOf(minter.address)).to.equal(price.mul("2"));

                await expect(minter.connect(user).withdrawEarnings(price.mul("2"))).to.be.revertedWith("Only admin can call this function");
            });
        });
    });
});
