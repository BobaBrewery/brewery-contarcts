// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../../../interfaces/IAdmin.sol";

contract MoveMinter is ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256 public counters = 300;
    address public NFTHolder;
    IERC721 public immutable nft;
    IAdmin public admin;
    IERC20 public USDT;
    uint256 public totalTokensDeposited;

    event Minted(address indexed buyer, uint256[] tokenIds, uint256 price);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "EXPIRED");
        _;
    }

    constructor(
        address _admin,
        address _nft,
        address _usdt,
        address _nftHolder
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        nft = IERC721(_nft);
        USDT = IERC20(_usdt);
        NFTHolder = _nftHolder;
    }

    function mint(
        uint256[] memory tokenIds,
        uint256 price,
        uint256 deadline,
        bytes memory signature
    ) external nonReentrant ensure(deadline) {
        require(tokenIds.length > 0, "Invalid amount");
        require(
            counters >= tokenIds.length,
            "The current batch has been sold out!"
        );
        require(
            checkMintSignature(
                signature,
                msg.sender,
                tokenIds,
                price,
                deadline
            ),
            "Invalid mint signature. Verification failed"
        );

        counters = counters.sub(tokenIds.length);

        // transfer nft
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                nft.ownerOf(tokenIds[i]) == NFTHolder,
                "Currently NFTs are sold"
            );
            nft.safeTransferFrom(NFTHolder, msg.sender, tokenIds[i]);
        }
        // transfer USDT
        USDT.safeTransferFrom(
            msg.sender,
            address(this),
            price.mul(tokenIds.length)
        );

        totalTokensDeposited = totalTokensDeposited.add(
            price.mul(tokenIds.length)
        );
        emit Minted(msg.sender, tokenIds, price);
    }

    // Increase sales volume
    function increaseCounter(uint256 _amount) public onlyAdmin {
        require(_amount > 0, "Invalid amount");
        counters = counters.add(_amount);
    }

    // function to withdraw earnings
    function withdrawEarnings(uint256 _amount) public onlyAdmin {
        uint256 balance = USDT.balanceOf(address(this));
        if (_amount > balance) {
            USDT.safeTransfer(address(msg.sender), balance);
        } else {
            USDT.safeTransfer(address(msg.sender), _amount);
        }
    }

    // Function to check if admin was the message signer
    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256[] memory tokenIds,
        uint256 price,
        uint256 deadline
    ) public view returns (bool) {
        return
            admin.isAdmin(
                getMintSigner(signature, user, tokenIds, price, deadline)
            );
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256[] memory tokenIds,
        uint256 price,
        uint256 deadline
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, tokenIds, price, deadline, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    receive() external payable {}
}
