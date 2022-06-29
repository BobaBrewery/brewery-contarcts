// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract CyberpopRefund is ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    //    IERC1155NFTPublic public immutable roleNft;
    IERC1155 public immutable roleNft;
    IERC20 public immutable USDT;
    address public immutable usdtHolder;
    address public immutable nftRecipient;
    uint256 private constant tokenId = 9;
    uint256 private constant rolePrice = 49000000000000000000;

    // Is Refund?
    mapping(address => bool) public refunded;

    event Refunded(address indexed buyer, uint256 amount);

    constructor(
        address _roleNft,
        address _usdt,
        address _usdtHolder,
        address _nftRecipient
    ) public {
        roleNft = IERC1155(_roleNft);
        USDT = IERC20(_usdt);
        usdtHolder = _usdtHolder;
        nftRecipient = _nftRecipient;
    }

    function refund() public {
        uint256 nftBalance = roleNft.balanceOf(msg.sender, tokenId);
        require(nftBalance > 0, "NFT balance insufficient");

        roleNft.safeTransferFrom(
            msg.sender,
            nftRecipient,
            tokenId,
            nftBalance,
            ""
        );
        USDT.safeTransferFrom(
            usdtHolder,
            msg.sender,
            rolePrice.mul(nftBalance)
        );

        emit Refunded(msg.sender, nftBalance);
    }

    receive() external payable {}
}
