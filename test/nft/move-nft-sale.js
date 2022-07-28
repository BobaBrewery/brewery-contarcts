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
    const default_increaseCounter = 100;
    const default_tokenIds = [23, 19, 9, 200, 233, 149, 199];
    const default_price = BigNumber.from("150").mul(BigNumber.from(NUMBER_1E18));
    let default_deadline = (Date.parse(new Date()) / 1000) + 600;

    // const
    const EXPIRED_TIME_DELTA = 700;

    const DEPLOYER_PRIVATE_KEY = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

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

    function signMint(userAddress, tokenIds, price, deadline, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, amount))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256[]', 'uint256', 'uint256', 'address'], [userAddress, tokenIds, price, deadline, contractAddress]));

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

        const AntmonsNFTMinter = await ethers.getContractFactory("MoveMinter");
        minter = await AntmonsNFTMinter.deploy(Admin.address, nft.address, payToken.address, holder.address);
        // console.log("Minter address:", minter.address);

        // mint nft
        await nft.mint(holder.address, 100, { gasLimit: 30000000 });
        await nft.mint(holder.address, 100, { gasLimit: 30000000 });
        await nft.mint(holder.address, 100, { gasLimit: 30000000 });
        await nft.mint(holder.address, 100, { gasLimit: 30000000 });
        // console.log("Holder nft balance:", await nft.balanceOf(holder.address));

        // setApprovalForAll
        await nft.connect(holder).setApprovalForAll(minter.address, true);

        // payToken transfer
        await payToken.transfer(user.address, BigNumber.from("100000000000000000000000"));
        await payToken.connect(user).approve(minter.address, BigNumber.from("100000000000000000000000"));
        await payToken.transfer(user2.address, BigNumber.from("100000000000000000000000"));
        await payToken.connect(user2).approve(minter.address, BigNumber.from("100000000000000000000000"));
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
            expect(userBalance).be.gt(default_price.mul(default_tokenIds.length));

            let user2Balance = await payToken.balanceOf(user2.address);
            // console.log("User2 balance of payToken:", user2Balance);
            expect(user2Balance).be.gt(default_price.mul(default_tokenIds.length));
        });

    });

    context("Signature validation", async function () {
        describe("check mint signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signMint(user2.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should fail if signature is for a different tokenIds", async function () {
                // Given
                const new_tokenIds = [12, 13, 14];
                const sig = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should fail if signature is for a different price", async function () {
                // Given
                const sig = signMint(user.address, default_tokenIds, default_price.mul(2), default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should fail if signature is for a different deadline", async function () {
                // Given
                const new_deadline = (Date.parse(new Date()) / 1000) + 600;
                const sig = signMint(user.address, default_tokenIds, default_price, new_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, payToken.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(minter.checkMintSignature(sig.slice(1), user.address, default_tokenIds, default_price, default_deadline)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer not admin", async function () {
                // Given
                await Admin.removeAdmin(deployer.address);
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256[]', 'uint256', 'uint256', 'address'], [user.address, default_tokenIds, default_price, default_deadline, minter.address]));
                const { v, r, s } = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, default_tokenIds, default_price, default_deadline)).to.be.false;
            });
        });
    });

    context("Public Sale", async function () {
        describe("Mint", async function () {
            it("Allow multiple purchases by the same user", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                const new_tokenIds = [1, 2, 3, 4, 5];
                const sig2 = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(new_tokenIds, default_price, default_deadline, sig2);

                expect(await nft.balanceOf(user.address)).to.equal(default_tokenIds.length + new_tokenIds.length);
            });

            it("Allows users to purchase one or more at a time", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                const new_tokenIds = [1];
                const sig2 = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(new_tokenIds, default_price, default_deadline, sig2);

                expect(await nft.balanceOf(user.address)).to.equal(default_tokenIds.length + new_tokenIds.length);
            });

            it("should update balance after mint succeed", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await nft.balanceOf(user.address)).to.equal(default_tokenIds.length);
            });

            it("should update payToken balance after mint succeed", async function () {
                expect(await payToken.balanceOf(minter.address)).to.equal(0);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(default_price.mul(default_tokenIds.length));
            });

            it("should update totalTokensDeposited after mint succeed", async function () {
                expect(await minter.totalTokensDeposited()).to.equal(0);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await minter.totalTokensDeposited()).to.equal(default_price.mul(default_tokenIds.length));

                const new_tokenIds = [1, 2, 3];
                const sig2 = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(new_tokenIds, default_price, default_deadline, sig2);

                expect(await minter.totalTokensDeposited()).to.equal(default_price.mul(default_tokenIds.length).add(default_price.mul(new_tokenIds.length)));
            });

            it("should update counter after mint succeed", async function () {
                let counter = 300;
                expect(await minter.counters()).to.equal(counter);

                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await minter.counters()).to.equal((counter - default_tokenIds.length));
            });

            it("should not mint if tokenIds is empty", async function () {
                const sig = signMint(user.address, [], default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                await expect(minter.connect(user).mint([], default_price, default_deadline, sig)).to.be.revertedWith("Invalid amount");
            });

            it("should not mint if the deadline is exceeded", async function () {
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [EXPIRED_TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig)).to.be.revertedWith("EXPIRED");
                default_deadline = (Date.parse(new Date()) / 1000) + 5000;
            });


            it("should not mint if counter overflow", async function () {
                expect(await minter.counters()).to.equal(300);

                const new_tokenIds = Array.from(Array(301), (v, k) => k + 1)
                const sig = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);

                await expect(minter.connect(user).mint(new_tokenIds, default_price, default_deadline, sig)).to.be.revertedWith("The current batch has been sold out!");
            });

            it("should not mint if the NFT has been sold", async function () {
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                await expect(minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig)).to.be.revertedWith("Currently NFTs are sold");
            });
        });
    });

    context("Increase Counter", async function () {
        describe("Increase Counter", async function () {
            it("should increase counter", async function () {
                const counter_before = await minter.counters();
                await minter.increaseCounter(default_increaseCounter);

                expect(await minter.counters()).to.equal(counter_before.add(default_increaseCounter));
            });

            it("should mint after increase counter", async function () {
                expect(await minter.counters()).to.equal(300);

                const new_tokenIds = Array.from(Array(300), (v, k) => k + 1)
                const sig = signMint(user.address, new_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(new_tokenIds, default_price, default_deadline, sig)

                expect(await minter.counters()).to.equal(0);

                await minter.increaseCounter(default_increaseCounter);
                const new_tokenIds2 = [301, 350, 399];
                const sig2 = signMint(user.address, new_tokenIds2, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(new_tokenIds2, default_price, default_deadline, sig2);

                expect(await nft.balanceOf(user.address)).to.equal(new_tokenIds.length + new_tokenIds2.length);
                expect(await minter.counters()).to.equal(default_increaseCounter - new_tokenIds2.length);
            });

            it("should not increase counter when amount lt 1", async function () {
                await expect(minter.increaseCounter(0)).to.revertedWith("Invalid amount");
            });

            it("should not increase counter if not an administrator", async function () {
                await expect(minter.connect(user).increaseCounter(default_increaseCounter)).to.revertedWith("Only admin can call this function.");
            });
        });
    });

    context("Withdraw", async function () {
        describe("Withdraw Earnings", async function () {
            it("should withdraw earnings", async function () {
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(default_price.mul(default_tokenIds.length));

                await minter.withdrawEarnings(default_price.mul(default_tokenIds.length));

                expect(await payToken.balanceOf(minter.address)).to.equal(0);
            });

            it("should not withdraw if not an administrator", async function () {
                const sig = signMint(user.address, default_tokenIds, default_price, default_deadline, minter.address, DEPLOYER_PRIVATE_KEY);
                await minter.connect(user).mint(default_tokenIds, default_price, default_deadline, sig);

                expect(await payToken.balanceOf(minter.address)).to.equal(default_price.mul(default_tokenIds.length));
                await expect(minter.connect(user).withdrawEarnings(default_price.mul(default_tokenIds.length))).to.revertedWith("Only admin can call this function.");
            });
        });
    });
});
