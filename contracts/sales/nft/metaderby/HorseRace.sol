// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../../interfaces/IAdmin.sol";

contract HorseRace is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IAdmin public admin;
    IERC20 public BRE;
    bool public locked;
    mapping(uint256 => mapping(address => uint256)) public betInfos;
    mapping(uint256 => uint256) public totalStakeById;
    uint256 public totalStakes;

    event Stake(address indexed bettor, uint256 horseId, uint256 amount);
    event Withdraw(address indexed bettor, uint256 horseId, uint256 amount);
    event Claim(address indexed bettor, uint256 amount);

    constructor(address _admin, address _bre) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        BRE = IERC20(_bre);
    }

    function setLock(bool _lock) external onlyOwner {
        locked = _lock;
    }

    function bet(uint256 _horseId, uint256 _amount) external nonReentrant {
        require(!locked, "Stopped betting");
        require(_amount > 0, "Bet: Invalid amount");

        BRE.safeTransferFrom(msg.sender, address(this), _amount);

        betInfos[_horseId][msg.sender] = betInfos[_horseId][msg.sender].add(
            _amount
        );
        totalStakeById[_horseId] = totalStakeById[_horseId].add(_amount);
        totalStakes = totalStakes.add(_amount);
        emit Stake(msg.sender, _horseId, _amount);
    }

    function withdraw(uint256 _horseId, uint256 _amount) external nonReentrant {
        require(!locked, "Stopped withdraw");
        uint256 _stakes = betInfos[_horseId][msg.sender];
        require(_stakes >= _amount, "Withdraw: Invalid amount");
        betInfos[_horseId][msg.sender] = betInfos[_horseId][msg.sender].sub(
            _amount
        );
        totalStakeById[_horseId] = totalStakeById[_horseId].sub(_amount);
        totalStakes = totalStakes.sub(_amount);

        BRE.safeTransfer(msg.sender, _amount);

        emit Withdraw(msg.sender, _horseId, _amount);
    }

    function claim(uint256 _amount, bytes memory signature)
        external
        nonReentrant
    {
        require(
            checkMintSignature(signature, msg.sender, _amount),
            "Invalid mint signature. Verification failed"
        );
        uint256 balance = breBalance();
        require(_amount > 0 && balance >= _amount, "Claim: Invalid amount");

        BRE.safeTransfer(address(msg.sender), _amount);
        emit Claim(msg.sender, _amount);
    }

    function breBalance() public view returns (uint256) {
        return BRE.balanceOf(address(this));
    }

    function withdrawEarning(uint256 _amount) public onlyOwner {
        uint256 balance = BRE.balanceOf(address(this));
        if (_amount > balance) {
            BRE.safeTransfer(address(msg.sender), balance);
        } else {
            BRE.safeTransfer(address(msg.sender), _amount);
        }
    }

    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256 amount
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, amount));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 amount
    ) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(user, amount, address(this)));
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function pause() external onlyOwner {
        _pause();
    }

    receive() external payable {}
}
