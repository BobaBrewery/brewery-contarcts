// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interface/IERC1155NFTPublic.sol";
import "../../../interfaces/IAdmin.sol";

contract CyberPopMinter is ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC1155NFTPublic public immutable nft;
    IAdmin public admin;
    IERC20 public immutable USDT;
    uint256 public immutable rolePrice = 49000000000000000000;
    uint256 public totalTokensDeposited;


    // left nft amount
    mapping(uint256 => uint256) public counters;

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(address _admin, address _nft, address _usdt) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        nft = IERC1155NFTPublic(_nft);
        counters[2] = 50;
        USDT = IERC20(_usdt);
    }

    function mint(
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external nonReentrant {
        require(counters[id] >= amount, "The current batch has been sold out!");
        USDT.safeTransferFrom(msg.sender, address(this), rolePrice);
        totalTokensDeposited += rolePrice;

        // require(
        //     checkMintSignature(signature, msg.sender, 0, 1),
        //     "Invalid mint signature. Verification failed"
        // );
        counters[id] = counters[id].sub(amount);
        nft.mint(msg.sender, id, amount, data);
    }

    function mintBatch(
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external nonReentrant {
        require(ids.length == amounts.length, "Incorrect entry format.");
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            require(
                counters[id] >= amount,
                "The current batch has been sold out!"
            );
            counters[id] = counters[id].sub(amount);
        }

        nft.mintBatch(msg.sender, ids, amounts, data);
    }
    // function to withdraw earnings
    function withdrawEarnings() public onlyAdmin {
        uint256 balance = USDT.balanceOf(address(this));
        USDT.safeTransfer(msg.sender, balance);
    }


    // // Function to check if admin was the message signer
    // function checkMintSignature(
    //     bytes memory signature,
    //     address user,
    //     uint256 price,
    //     uint256 amount
    // ) public view returns (bool) {
    //     return admin.isAdmin(getMintSigner(signature, user, price, amount));
    // }

    // /// @notice     Check who signed the message
    // /// @param      signature is the message allowing user to participate in sale
    // /// @param      user is the address of user for which we're signing the message
    // function getMintSigner(
    //     bytes memory signature,
    //     address user,
    //     uint256 price,
    //     uint256 amount
    // ) public view returns (address) {
    //     bytes32 hash = keccak256(
    //         abi.encodePacked(user, price, amount, address(this))
    //     );
    //     bytes32 messageHash = hash.toEthSignedMessageHash();
    //     return messageHash.recover(signature);
    // }

    receive() external payable {}
}
