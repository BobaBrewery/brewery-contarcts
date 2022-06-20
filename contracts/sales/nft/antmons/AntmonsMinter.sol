// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../../../interfaces/IAdmin.sol";

contract AntmonsMinter is ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    uint256[] public counters = [100, 100, 100];
    uint256[] public nftIndex = [8101, 8201, 8301];

    address public NFTHolder;
    IERC721 public immutable nft;
    IAdmin public admin;
    IERC20 public USDT;
    uint256 public totalTokensDeposited;

    event Minted(address indexed buyer, uint256 level, uint256 amount);

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
        address _nftHolder
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        nft = IERC721(_nft);
        USDT = IERC20(_usdt);
        NFTHolder = _nftHolder;
    }

    function mint(
        uint256 amount,
        uint256 level,
        uint256 price,
        bytes memory signature
    ) external nonReentrant {
        require(level >= 0 && level < 3, "Invalid level");
        require(amount > 0, "Invalid amount");
        require(
            counters[level] >= amount,
            "The current batch has been sold out!"
        );
        require(
            checkMintSignature(signature, msg.sender, price, level, amount),
            "Invalid mint signature. Verification failed"
        );

        counters[level] = counters[level].sub(amount);

        // transfer nft
        for (uint256 i = 0; i < amount; i++) {
            nft.safeTransferFrom(NFTHolder, msg.sender, nftIndex[level]);
            nftIndex[level] = nftIndex[level].add(1);
        }
        // transfer USDT
        USDT.safeTransferFrom(msg.sender, address(this), price * amount);

        totalTokensDeposited = totalTokensDeposited.add(price * amount);
        emit Minted(msg.sender, level, amount);
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
        uint256 price,
        uint256 level,
        uint256 amount
    ) public view returns (bool) {
        return
            admin.isAdmin(getMintSigner(signature, user, price, level, amount));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 price,
        uint256 level,
        uint256 amount
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, price, level, amount, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    receive() external payable {}
}