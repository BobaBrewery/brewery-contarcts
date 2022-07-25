// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../../../interfaces/IAdmin.sol";

contract MoveRefund is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC721 public immutable nft;
    IAdmin public admin;
    IERC20 public USDT;
    address private USDTHolder;
    mapping(address => bool) public refunded;

    event Refunded(address indexed buyer, uint256[] tokenIds, uint256 price);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(
        address _admin,
        address _nft,
        address _usdt,
        address _usdtHolder
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        nft = IERC721(_nft);
        USDT = IERC20(_usdt);
        USDTHolder = _usdtHolder;
    }

    function refund(
        uint256[] memory tokenIds,
        uint256 price,
        bytes memory signature
    ) external nonReentrant {
        require(tokenIds.length > 0, "Invalid amount");
        require(!refunded[msg.sender], "The user has been refunded");
        require(
            checkMintSignature(signature, msg.sender, tokenIds, price),
            "Invalid refund signature. Verification failed"
        );

        // transfer nft
        for (uint256 i = 0; i < tokenIds.length; i++) {
            nft.safeTransferFrom(msg.sender, USDTHolder, tokenIds[i]);
        }
        // transfer USDT
        USDT.safeTransferFrom(
            USDTHolder,
            msg.sender,
            price.mul(tokenIds.length)
        );

        refunded[msg.sender] = true;
        emit Refunded(msg.sender, tokenIds, price);
    }

    // Function to check if admin was the message signer
    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256[] memory tokenIds,
        uint256 price
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, tokenIds, price));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256[] memory tokenIds,
        uint256 price
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, tokenIds, price, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    receive() external payable {}
}
