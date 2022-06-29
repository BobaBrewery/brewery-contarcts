const { BigNumber, ethers } = require("ethers");
const IERC20 = artifacts.require("IERC20");
const IERC1155 = artifacts.require("IERC1155");
const { formatUnits } = require("ethers/lib/utils");
const CyberpopRefund = artifacts.require("CyberpopRefund");


// ganache -f https://bsc-dataseed1.ninicoin.io/ --wallet.accounts 0x94e6de53e500b9fec28037c583f5214c854c7229329ce9baf6f5577bd95f9c9a,10000000000000000000000 -u 0xf977814e90da44bfa03b6295a0616a897441acec -u 0x153292fBD986978E4bd6EF63DA2Ce9ad9a2Be0b1

contract("Cyberpop Refund", (accounts) => {
    const USDT_WHALE = "0xf977814e90da44bfa03b6295a0616a897441acec"
    const NFT_RECIPIENT_ADDR = "0x7291030263771b40731D6Bc6b352358D23F5737F"
    const ROLE_NFT = "0x10fdE59432D1d6eE7aD25448e3D8B9b3D2c08b89"
    const BSC_USDT = "0x55d398326f99059fF775485246999027B3197955"
    const NFT_HOLDER = "0x153292fBD986978E4bd6EF63DA2Ce9ad9a2Be0b1"
    const approve_amount = BigNumber.from("1000000").mul("1000000000000000000")

    it("Refund", async () => {
        const USDT = await IERC20.at(BSC_USDT);
        let usdtWhale_balance_before = formatUnits((await USDT.balanceOf(USDT_WHALE)).toString(), 18);
        console.log("Before: Whale USDT balance:", usdtWhale_balance_before);
        let usdtNFTHolder_balance_before = formatUnits((await USDT.balanceOf(NFT_HOLDER)).toString(), 18);
        console.log("Before: NFTHolder USDT balance:", usdtNFTHolder_balance_before);

        const refund = await CyberpopRefund.new(ROLE_NFT, BSC_USDT, USDT_WHALE, NFT_RECIPIENT_ADDR);
        console.log("refund:", refund.address);

        await USDT.approve(refund.address, approve_amount, { from: USDT_WHALE })

        const NFT = await IERC1155.at(ROLE_NFT);
        let nftHolder_balance_before = (await NFT.balanceOf(NFT_HOLDER, 9)).toString();
        console.log("Before: Holder NFT balance:", nftHolder_balance_before);
        let nftRecipient_balance_before = (await NFT.balanceOf(NFT_RECIPIENT_ADDR, 9)).toString();
        console.log("Before: Recipient NFT balance:", nftRecipient_balance_before);


        await NFT.setApprovalForAll(refund.address, true, { from: NFT_HOLDER });

        await refund.refund({ from: NFT_HOLDER });

        let nftHolder_balance_after = (await NFT.balanceOf(NFT_HOLDER, 9)).toString();
        console.log("After: Holder NFT balance:", nftHolder_balance_after);
        let nftRecipient_balance_after = (await NFT.balanceOf(NFT_RECIPIENT_ADDR, 9)).toString();
        console.log("After: Recipient NFT balance:", nftRecipient_balance_after);
        console.log("After: Recipient get NFT amount:", nftRecipient_balance_after - nftRecipient_balance_before);


        let usdtWhale_balance_after = formatUnits((await USDT.balanceOf(USDT_WHALE)).toString(), 18);
        console.log("After: Whale USDT balance:", usdtWhale_balance_after);
        let usdtNFTHolder_balance_after = formatUnits((await USDT.balanceOf(NFT_HOLDER)).toString(), 18);
        console.log("After: NFTHolder USDT balance:", usdtNFTHolder_balance_after);
        console.log("After: NFTHolder get USDT amount:", usdtNFTHolder_balance_after - usdtNFTHolder_balance_before);
    });
});