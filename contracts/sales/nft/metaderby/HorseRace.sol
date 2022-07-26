// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../../../interfaces/IAdmin.sol";

contract HorseRace is ReentrancyGuard, Pausable {
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

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(address _admin, address _bre) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        BRE = IERC20(_bre);
    }

    function setLock(bool _lock) external onlyAdmin {
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

    function breBalance() public view returns (uint256) {
        return BRE.balanceOf(address(this));
    }

    function withdrawEarning(uint256 _amount) public onlyAdmin {
        uint256 balance = BRE.balanceOf(address(this));
        if (_amount > balance) {
            BRE.safeTransfer(address(msg.sender), balance);
        } else {
            BRE.safeTransfer(address(msg.sender), _amount);
        }
    }

    function pause() external onlyAdmin {
        _pause();
    }

    receive() external payable {}
}
