// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../../../interfaces/IAdmin.sol";


contract WLMinter is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IAdmin public admin;
    IERC20 public USDT;
    uint256 public counter;

    // number participated
    mapping(address => uint256) public saleParticipated;

    event Minted(address indexed buyer, uint256 amount, uint256 price);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(address _admin, address _usdt) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        USDT = IERC20(_usdt);
    }

    function mint(
        uint256 amount,
        uint256 price,
        bytes memory signature
    ) external nonReentrant {
        require(
            checkMintSignature(signature, msg.sender, price, amount),
            "Invalid mint signature. Verification failed"
        );
        saleParticipated[msg.sender] = saleParticipated[msg.sender].add(amount);

        // transfer USDT
        USDT.safeTransferFrom(msg.sender, address(this), price * amount);

        counter = counter.add(amount);
        emit Minted(msg.sender, amount, price);
    }


    // function to withdraw earnings
    function withdrawEarnings(uint _amount) public onlyAdmin {
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
        uint256 amount
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, price, amount));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 price,
        uint256 amount
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, price, amount, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    receive() external payable {}
}
