// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../../../interfaces/IAdmin.sol";

contract HorseRaceWeekly is ReentrancyGuard, Pausable, Ownable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IAdmin public admin;
    IERC20 public Token;
    struct BetInfo {
        uint256 totalStakes;
        mapping(uint256 => mapping(address => uint256)) betInfos;
        mapping(uint256 => uint256) totalStakeById;
        mapping(address => bool) isClaimed;
    }
    mapping(uint256 => BetInfo) public weeklyInfos;
    mapping(uint256 => uint256) public betEndInfo;

    event Stake(
        uint256 indexed period,
        address indexed bettor,
        uint256 horseId,
        uint256 amount
    );
    event Claim(uint256 indexed period, address indexed bettor, uint256 amount);

    constructor(address _admin, address _token) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        Token = IERC20(_token);
    }

    function setBetEndTime(uint256 _periodId, uint256 _endTime)
        external
        onlyOwner
    {
        betEndInfo[_periodId] = _endTime;
    }

    function bet(
        uint256 _periodId,
        uint256 _horseId,
        uint256 _amount
    ) external nonReentrant {
        require(block.timestamp <= betEndInfo[_periodId], "Stopped betting");
        require(_amount > 0, "Bet: Invalid amount");

        Token.safeTransferFrom(msg.sender, address(this), _amount);

        BetInfo storage betInfo = weeklyInfos[_periodId];

        betInfo.betInfos[_horseId][msg.sender] = betInfo
        .betInfos[_horseId][msg.sender].add(_amount);
        betInfo.totalStakeById[_horseId] = betInfo.totalStakeById[_horseId].add(
            _amount
        );
        betInfo.totalStakes = betInfo.totalStakes.add(_amount);
        emit Stake(_periodId, msg.sender, _horseId, _amount);
    }

    function claim(
        uint256 _periodId,
        uint256 _amount,
        bytes memory signature
    ) external nonReentrant {
        BetInfo storage betInfo = weeklyInfos[_periodId];
        require(
            !betInfo.isClaimed[msg.sender],
            "This address has already been claimed."
        );
        require(
            checkMintSignature(signature, msg.sender, _periodId, _amount),
            "Invalid claim signature. Verification failed"
        );
        uint256 balance = tokenBalance();
        require(_amount > 0 && balance >= _amount, "Claim: Invalid amount");

        betInfo.isClaimed[msg.sender] = true;
        Token.safeTransfer(address(msg.sender), _amount);
        emit Claim(_periodId, msg.sender, _amount);
    }

    function getBetInfo(
        uint256 _period,
        uint256 _horseId,
        address _user
    ) public view returns (uint256) {
        uint256 userBetAmount = weeklyInfos[_period].betInfos[_horseId][_user];

        return userBetAmount;
    }

    function getTotalBetByHorseId(uint256 _period, uint256 _horseId)
        public
        view
        returns (uint256)
    {
        uint256 totalBetByHorseId = weeklyInfos[_period].totalStakeById[
            _horseId
        ];
        return totalBetByHorseId;
    }

    function getClaimInfo(uint256 _period, address _user)
        public
        view
        returns (bool)
    {
        bool userClaimed = weeklyInfos[_period].isClaimed[_user];
        return userClaimed;
    }

    function tokenBalance() public view returns (uint256) {
        return Token.balanceOf(address(this));
    }

    function withdrawEarning(uint256 _amount) public onlyOwner {
        uint256 balance = Token.balanceOf(address(this));
        if (_amount > balance) {
            Token.safeTransfer(address(msg.sender), balance);
        } else {
            Token.safeTransfer(address(msg.sender), _amount);
        }
    }

    function setToken(address _token) public onlyOwner {
        require(_token != address(0), "_token != address(0)");
        Token = IERC20(_token);
    }

    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256 periodId,
        uint256 amount
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, periodId, amount));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 periodId,
        uint256 amount
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, periodId, amount, address(this))
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function pause() external onlyOwner {
        _pause();
    }

    receive() external payable {}
}
