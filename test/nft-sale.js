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

    function signWhitelist(userAddress, contractAddress, price, privateKey) {
        // compute keccak256(abi.encodePacked(user, amount))
        const digest = ethers.utils.keccak256(ethers.utils.solidityPack(['address', 'uint256', 'address'], [userAddress, price, contractAddress]));

        return generateSignature(digest, privateKey);
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
            let minterPrice = await minter.ethAmount();
            let minterCounter = await minter.counter();
            expect(minterPrice).to.equal(ethAmount);
            expect(minterCounter).to.equal(counter);
        })

    });

    context("Voucher", async function () {
        it("Should buy 1 nft for free", async function () {
            expect((await minter.numberOfVoucher())).to.equal(0);

            const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);

            await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
            await ethers.provider.send("evm_mine");

            await minter.connect(user).mintWithVoucher(sig);

            expect((await minter.numberOfVoucher())).to.equal(1);
            expect((await nft.balanceOf(user.address))).to.equal(1);
        })

        it("Should buy nft only once", async function () {
            expect((await minter.numberOfVoucher())).to.equal(0);

            const sig = signVoucher(user.address, minter.address, DEPLOYER_PRIVATE_KEY);

            await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
            await ethers.provider.send("evm_mine");

            await minter.connect(user).mintWithVoucher(sig);

            expect((await minter.numberOfVoucher())).to.equal(1);
            expect((await nft.balanceOf(user.address))).to.equal(1);

            await expect(minter.connect(user).mintWithVoucher(sig))
                .to.be.revertedWith("User can participate only once.");
        })
    })
    context("whitelist", async function(){
        it("should buy item if wl", async function(){

            expect((await minter.numberOfWhitelist())).to.equal(0);
            const sig = signWhitelist(deployer.address, minter.address, DEPLOYER_PRIVATE_KEY);
            await ethers.provider.send("evm_increaseTime", [TIME_DELTA]);
            await ethers.provider.send("evm_mine");

            await minter.mintWithWhitelist(sig, amount);

            expect((await minter.numberOfVoucher())).to.equal(1);

        })

    })
});
