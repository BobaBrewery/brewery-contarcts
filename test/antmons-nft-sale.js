const { ethers } = require("hardhat");
const { expect } = require("chai");
const ethUtil = require("ethereumjs-util")
const { BigNumber } = require("ethers");

describe("BreweryNFTSale", function () {

    let Admin;
    let nft;
    let minter;
    let payToken;
    let deployer, signer, holder, user, user2;
    const NUMBER_1E18 = "1000000000000000000";
    const lvl_one_price = BigNumber.from("50").mul(BigNumber.from(NUMBER_1E18));
    const lvl_two_price = BigNumber.from("100").mul(BigNumber.from(NUMBER_1E18));
    const lvl_three_price = BigNumber.from("200").mul(BigNumber.from(NUMBER_1E18));
    const lvl_one = 0;
    const lvl_two = 1;
    const lvl_three = 2;
    const lvl_error = 3;

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
        const { v, r, s } = ethUtil.ecsign(prefixedHash, Buffer.from(privateKey, 'hex'))

        // generate signature by concatenating r(32), s(32), v(1) in this order
        // Reference: https://github.com/OpenZeppelin/openzeppelin-contracts/blob/76fe1548aee183dfcc395364f0745fe153a56141/contracts/ECRecovery.sol#L39-L43
        const vb = Buffer.from([v]);
        const signature = Buffer.concat([r, s, vb]);

        return signature;
    }

    function signMint(userAddress, price, level, amount, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, amount))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'uint256', 'address'], [userAddress, price, level, amount, contractAddress]));

        return generateSignature(digest, privateKey);
    }

    beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        signer = accounts[1];
        holder = accounts[2];
        user = accounts[3];
        user2 = accounts[4];

        const tokenName = "MOCK-TOKEN";
        const symbol = "MCK";
        const totalSupply = "1000000000000000000000000000";
        const decimals = 18;
        const MCK = await ethers.getContractFactory("BreToken");
        payToken = await MCK.deploy(tokenName, symbol, totalSupply, decimals);
        // console.log("PayToken address:", payToken.address);

        const MedievalNFT = await ethers.getContractFactory("MedievalNFT");
        nft = await MedievalNFT.deploy();
        // console.log("NFT address:", nft.address);

        const AdminFactory = await ethers.getContractFactory("Admin");
        Admin = await AdminFactory.deploy([deployer.address, signer.address]);
        // console.log("Admin address:", Admin.address);

        const AntmonsNFTMinter = await ethers.getContractFactory("AntmonsMinter");
        minter = await AntmonsNFTMinter.deploy(Admin.address, nft.address, payToken.address, holder.address);
        // console.log("Minter address:", minter.address);

        // mint nft
        await nft.mint(holder.address, 30);
        // console.log("Holder nft balance:", await nft.balanceOf(holder.address));

        // setApprovalForAll
        await nft.connect(holder).setApprovalForAll(minter.address, true);

        // payToken transfer
        await payToken.transfer(user.address, BigNumber.from("10000000000000000000000"));
        await payToken.connect(user).approve(minter.address, BigNumber.from("10000000000000000000000"));
        await payToken.transfer(user2.address, BigNumber.from("10000000000000000000000"));
        await payToken.connect(user2).approve(minter.address, BigNumber.from("10000000000000000000000"));
    })


    context("setup", async function () {
        it('should setup the admin correctly', async function () {
            // Given
            let admin = await minter.admin();

            // Then
            expect(admin).to.equal(Admin.address);
        });

        it("should approveForAll to minter", async function () {
            let isApproved = await nft.isApprovedForAll(holder.address, minter.address);

            expect(isApproved).be.true;
        });

        it("should have payToken in user's wallet", async function () {
            let userBalance = await payToken.balanceOf(user.address);
            // console.log("User balance of payToken:", userBalance);
            expect(userBalance).be.gt(lvl_one_price);

            let user2Balance = await payToken.balanceOf(user2.address);
            // console.log("User2 balance of payToken:", user2Balance);
            expect(user2Balance).be.gt(lvl_one_price);
        });

    });

    context("Signature validation", async function () {
        describe("check mint signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signMint(user2.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.false;
            });

            it("Should fail if signature is for a different price", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price.mul(2), lvl_one, 2, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.false;
            });

            it("Should fail if signature is for a different level", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_two, 2)).to.be.false;
            });

            it("Should fail if signature is for a different amount", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price.mul(2), lvl_one, 2, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price.mul(2), lvl_one, 1)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, payToken.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(minter.checkMintSignature(sig.slice(1), user.address, lvl_one_price, lvl_one, 2)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer not admin", async function () {
                // Given
                await Admin.removeAdmin(deployer.address);
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'uint256', 'uint256', 'address'], [user.address, lvl_one_price, lvl_one, 2, minter.address]));
                const { v, r, s } = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, lvl_one_price, lvl_one, 2)).to.be.false;
            });
        });
    });

    context("Public Sale", async function () {
        describe("Mint", async function () {
            it("should mint with level one", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_one, lvl_one_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_one_price.mul(2));
                expect(await nft.balanceOf(user.address)).to.equal(2);
            });

            it("should mint with level two", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, lvl_two_price, lvl_two, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_two, lvl_two_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_two_price.mul(2));
                expect(await nft.balanceOf(user.address)).to.equal(2);
            });

            it("should mint with level three", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, lvl_three_price, lvl_three, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_three, lvl_three_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_three_price.mul(2));
                expect(await nft.balanceOf(user.address)).to.equal(2);
            });

            it("should update balance after mint succeed", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, lvl_one_price, lvl_one, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(1, lvl_one, lvl_one_price, sig);

                expect(await nft.balanceOf(user.address)).to.equal(1);
            });

            it("should update payToken balance after mint succeed", async function () {
                expect(await payToken.balanceOf(minter.address)).to.equal(0);

                const sig = signMint(user.address, lvl_three_price, lvl_three, 3, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(3, lvl_three, lvl_three_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_three_price.mul(3));
            });

            it("should update totalTokensDeposited after mint succeed", async function () {
                expect(await minter.totalTokensDeposited()).to.equal(0);

                const sig = signMint(user.address, lvl_three_price, lvl_three, 3, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(3, lvl_three, lvl_three_price, sig);

                expect(await minter.totalTokensDeposited()).to.equal(lvl_three_price.mul(3));

                const sig2 = signMint(user.address, lvl_two_price, lvl_two, 5, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(5, lvl_two, lvl_two_price, sig2);

                expect(await minter.totalTokensDeposited()).to.equal(lvl_three_price.mul(3).add(lvl_two_price.mul(5)));
            });

            it("should update counter after mint succeed", async function () {
                let counter = 10;
                expect(await minter.counters(lvl_one)).to.equal(counter);

                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_one, lvl_one_price, sig);

                expect(await minter.counters(lvl_one)).to.equal((counter - 2));
            });

            it("should not mint if amount equal 0", async function () {
                const sig = signMint(user.address, lvl_one_price, lvl_one, 0, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).mint(0, lvl_one, lvl_one_price, sig)).to.be.revertedWith("Invalid amount");
            });

            it("should not mint if level overflow", async function () {
                const sig = signMint(user.address, lvl_one_price, lvl_error, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).mint(2, lvl_error, lvl_one_price, sig)).to.be.revertedWith("Invalid level");
            });


            it("should not mint if counter overflow", async function () {
                expect(await minter.counters(lvl_one)).to.equal(10);

                const sig = signMint(user.address, lvl_one_price, lvl_one, 11, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).mint(11, lvl_one, lvl_one_price, sig)).to.be.revertedWith("The current batch has been sold out!");
            });
        });
    });

    context("Withdraw", async function () {
        describe("Withdraw Earnings", async function () {
            it("should withdraw earnings", async function () {
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_one, lvl_one_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_one_price.mul(2));

                await minter.withdrawEarnings(lvl_one_price.mul(2));

                expect(await payToken.balanceOf(minter.address)).to.equal(0);
            });

            it("should not withdraw if not an administrator", async function () {
                const sig = signMint(user.address, lvl_one_price, lvl_one, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(2, lvl_one, lvl_one_price, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(lvl_one_price.mul(2));
                await expect(minter.connect(user).withdrawEarnings(lvl_one_price.mul(2))).to.revertedWith("Only admin can call this function.");
            });
        });
    });
});
