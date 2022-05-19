const { ethers } = require("hardhat");
const { expect, use } = require("chai");
const ethUtil = require("ethereumjs-util")
const { BigNumber } = require("ethers");

describe("BreweryNFTSale", function () {

    let Admin;
    let nft;
    let minter;
    let deployer, signer, user, user2;

    // nft variable
    let counter = 300;
    // 0
    let zero_price = ethers.utils.parseUnits("0");
    // 0.1 eth
    let price = ethers.utils.parseUnits("0.1");

    // const
    const TIME_DELTA = 10;
    const MINT_ROLE_BYTES32 = "0x3a5b873628a2c49bf313473942acc8932f6f84c76b74bf3db0e4d8b51277a623"

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

    function signVoucher(userAddress, contractAddress, privateKey) {
        // compute keccak256(abi.encodePacked(user, address(this))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address', 'string'], [userAddress, contractAddress, 'voucher']));

        return generateSignature(digest, privateKey);
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

        const MedievalNFT = await ethers.getContractFactory("MedievalNFT");
        nft = await MedievalNFT.deploy();

        const AdminFactory = await ethers.getContractFactory("Admin");
        Admin = await AdminFactory.deploy([deployer.address, signer.address]);

        const BreweryNFTMinter = await ethers.getContractFactory("NFTMinter");
        minter = await BreweryNFTMinter.deploy(Admin.address, nft.address);

        // set eth price & sale amount
        await minter.setBatchCounter(counter);

        // set minter role
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
            let minterCounter = await minter.counter();

            expect(minterCounter).to.equal(counter);
        })

    });

    context("Signature validation", async function () {
        describe("check voucher signature", async function () {
            it("Should succeed for valid signature", async function () {
                // Given
                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkVoucherSignature(sig, user.address)).to.be.true;
            });

            it("Should fail if signature is for a different user", async function () {
                // Given
                const sig = signVoucher(user2.address, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkVoucherSignature(sig, user.address)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signVoucher(user.address, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkVoucherSignature(sig, user.address)).to.be.false;
            });

            it("Should revert if signature has wrong length", async function () {
                // Given
                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                await expect(minter.checkVoucherSignature(sig.slice(1), user.address)).to.be.revertedWith("ECDSA: invalid signature length");
            });

            it("Should revert if signature has wrong format", async function () {
                // Given
                const sig = Buffer.alloc(32 + 32 + 1);

                // Then
                await expect(minter.checkVoucherSignature(sig, user.address)).to.be.revertedWith("ECDSA: invalid signature 'v' value");
            });

            it("Should fail if signer not admin", async function () {
                // Given
                await Admin.removeAdmin(deployer.address);
                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkVoucherSignature(sig, user.address)).to.be.false;
            });

            it("Should fail if signature is applied to hash instead of prefixed EthereumSignedMessage hash", async function () {
                // Given
                const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'address', 'string'], [user.address, minter.address, "voucher"]));
                const { v, r, s } = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await minter.checkVoucherSignature(sig, user.address)).to.be.false;
            });
        });

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
                const sig = signMint(user.address, price.mul(2), 2, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });

            it("Should fail if signature is for a different amount", async function () {
                // Given
                const sig = signMint(user.address, price.mul(2), 2, nft.address, DEPLOYER_PRIVATE_KEY);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price.mul(2), 1)).to.be.false;
            });

            it("Should fail if signature is for a different contract", async function () {
                // Given
                const sig = signMint(user.address, price, 2, nft.address, DEPLOYER_PRIVATE_KEY);

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
                const { v, r, s } = ethUtil.ecsign(ethUtil.toBuffer(digest), Buffer.from(DEPLOYER_PRIVATE_KEY, 'hex'))
                const vb = Buffer.from([v]);
                const sig = Buffer.concat([r, s, vb]);

                // Then
                expect(await minter.checkMintSignature(sig, user.address, price, 2)).to.be.false;
            });
        });
    });

    context("Voucher", async function () {
        describe("Voucher Mint", async function () {
            it("Should buy 1 nft for free", async function () {
                expect((await minter.numberOfVoucher())).to.equal(0);

                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mintWithVoucher(sig);

                expect((await minter.numberOfVoucher())).to.equal(1);
                expect((await nft.balanceOf(user.address))).to.equal(1);
            });

            it("should update counter after mint succeed", async function () {
                expect(await minter.counter()).to.equal(counter);

                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mintWithVoucher(sig);

                expect(await minter.counter()).to.equal((counter - 1));
            });

            it("should not buy item over counter", async function () {
                await minter.setBatchCounter(1);
                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mintWithVoucher(sig);

                expect((await nft.balanceOf(user.address))).to.equal(1);

                const sig2 = signVoucher(user2.address, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user2).mintWithVoucher(sig2)).to.be.revertedWith("The current batch has been sold out!");
            });

            it("Should buy nft only once", async function () {
                expect((await minter.numberOfVoucher())).to.equal(0);

                const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mintWithVoucher(sig);

                expect((await minter.numberOfVoucher())).to.equal(1);
                expect((await nft.balanceOf(user.address))).to.equal(1);
                await expect(minter.connect(user).mintWithVoucher(sig))
                    .to.be.revertedWith("User can use voucher only once.");
            });
        });
    });

    context("whitelist", async function () {
        describe("Whitelist Mint", async function () {
            it("should mint with value", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig, { value: price.mul(2) });

                expect(await minter.getBalance()).to.equal(price.mul(2));
                expect((await nft.balanceOf(user.address))).to.equal(2);
            });

            it("should update counter after mint succeed", async function () {
                expect(await minter.counter()).to.equal(counter);

                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig);

                expect(await minter.counter()).to.equal((counter - 2));
            });

            it("should buy item if wl", async function () {
                expect((await nft.balanceOf(user.address))).to.equal(0);

                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig);

                expect((await nft.balanceOf(user.address))).to.equal(2);
            });

            it("should buy item only once", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig);

                expect((await nft.balanceOf(user.address))).to.equal(2);
                await expect(minter.connect(user).whitelistMint(2, sig)).to.revertedWith("User can mint only once.");
            });

            it("should not buy item over counter", async function () {
                await minter.setBatchCounter(5);
                const sig = signMint(user.address, zero_price, 6, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).whitelistMint(6, sig)).to.be.revertedWith("The current batch has been sold out!");
            });
        });
    });

    context("Public Sale", async function () {
        describe("Mint", async function () {
            it("should mint with value", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, zero_price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(sig, { value: price.mul(2) });

                expect(await minter.getBalance()).to.equal(price.mul(2));
                expect(await nft.balanceOf(user.address)).to.equal(1);
            });

            it("should update balance after mint succeed", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, zero_price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(sig);

                expect(await nft.balanceOf(user.address)).to.equal(1);
            });

            it("should update counter after mint succeed", async function () {
                expect(await minter.counter()).to.equal(counter);

                const sig = signMint(user.address, zero_price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(sig);

                expect(await minter.counter()).to.equal((counter - 1));
            });

            it("should buy item only once", async function () {
                expect(await nft.balanceOf(user.address)).to.equal(0);

                const sig = signMint(user.address, zero_price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).mint(sig);

                expect((await nft.balanceOf(user.address))).to.equal(1);
                await expect(minter.connect(user).mint(sig)).to.revertedWith("User can mint only once.");
            });

            it("should not buy item over counter", async function () {
                await minter.setBatchCounter(0);
                const sig = signMint(user.address, zero_price, 1, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");

                await expect(minter.connect(user).mint(sig)).to.be.revertedWith("The current batch has been sold out!");
            });
        });
    });

    context("Withdraw", async function () {
        describe("Withdraw Earnings", async function () {
            it("should withdraw earnings", async function () {
                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig, { value: price.mul(2) });

                expect(await minter.getBalance()).to.equal(price.mul(2));

                await minter.withdrawEarnings();

                expect(await minter.getBalance()).to.equal(0);
            });

            it("should not withdraw if not an administrator", async function () {
                const sig = signMint(user.address, zero_price, 2, minter.address, DEPLOYER_PRIVATE_KEY);
                await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
                await ethers.provider.send("evm_mine");
                await minter.connect(user).whitelistMint(2, sig, { value: price.mul(2) });

                expect(await minter.getBalance()).to.equal(price.mul(2));
                await expect(minter.connect(user).withdrawEarnings()).to.revertedWith("Only admin can call this function.");
            });
        });
    });
});