// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../../../interfaces/IAdmin.sol";

contract LostLandMinter is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC1155 public immutable LLBOX;
    address public immutable NFTHolder;
    IAdmin public admin;
    IERC20 public TOKEN;

    uint256 public counters = 199;
    uint256 public totalTokensDeposited;

    event Minted(
        address indexed buyer,
        uint256 tokenId,
        uint256 amount,
        uint256 price
    );

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
        address _token,
        address _nftHolder
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        LLBOX = IERC1155(_nft);
        TOKEN = IERC20(_token);
        NFTHolder = _nftHolder;
    }

    function mint(
        uint256 id,
        uint256 amount,
        uint256 price,
        bytes memory data,
        bytes memory signature
    ) external nonReentrant {
        require(amount > 0, "Invalid amount");
        require(counters >= amount, "The current batch has been sold out!");
        require(
            checkMintSignature(signature, msg.sender, id, amount, price),
            "Invalid mint signature. Verification failed"
        );

        counters = counters.sub(amount);
        TOKEN.safeTransferFrom(msg.sender, address(this), price.mul(amount));
        LLBOX.safeTransferFrom(NFTHolder, msg.sender, id, amount, data);

        totalTokensDeposited = totalTokensDeposited.add(price.mul(amount));
        emit Minted(msg.sender, id, amount, price);
    }

    // function to withdraw earnings
    function withdrawEarnings(uint256 _amount) public onlyAdmin {
        uint256 balance = TOKEN.balanceOf(address(this));
        if (_amount > balance) {
            TOKEN.safeTransfer(address(msg.sender), balance);
        } else {
            TOKEN.safeTransfer(address(msg.sender), _amount);
        }
    }

    // Function to check if admin was the message signer
    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256 id,
        uint256 amount,
        uint256 price
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, id, amount, price));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 id,
        uint256 amount,
        uint256 price
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, id, amount, price, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    receive() external payable {}
}
