// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import "../../../interfaces/IAdmin.sol";

contract HorseRace is ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IAdmin public admin;
    IERC20 public BRE;
    bytes32 public merkleRoot;
    uint256 public breAirdrop;
    uint256 public winHorseId;
    address public breFund;
    mapping(address => bool) public whitelist;
    mapping(uint256 => mapping(address => uint256)) public betInfos;
    mapping(uint256 => uint256) public totalStakeById;
    uint256 public totalStakes;

    event Stake(address indexed bettor, uint256 horseId, uint256 amount);
    event Whitelist(address indexed user, bool claimed);
    event Winner(uint256 horseId);
    event Claim(address indexed user, uint256 horseId, uint256 amount);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(
        address _admin,
        address _bre,
        address _breFund
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        BRE = IERC20(_bre);
        breFund = _breFund;
    }

    function setParams(bytes32 _merkleRoot, uint256 _breAirdrop)
        external
        onlyAdmin
    {
        merkleRoot = _merkleRoot;
        breAirdrop = _breAirdrop;
    }

    function setWinner(uint256 _horseId) external onlyAdmin {
        winHorseId = _horseId;
        emit Winner(winHorseId);
    }

    function whitelist(bytes32[] calldata merkleProof, uint256 horseId)
        external
        nonReentrant
    {
        require(!whitelist[msg.sender], "Address has already claimed");
        require(
            MerkleProof.verify(
                merkleProof,
                merkleRoot,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Address does not exist in list"
        );

        BRE.safeTransferFrom(breFund, address(this), breAirdrop);

        whitelist[msg.sender] = true;
        betInfos[horseId][msg.sender] = betInfos[horseId][msg.sender].add(
            breAirdrop
        );
        totalStakeById[horseId] = totalStakeById[horseId].add(breAirdrop);
        totalStakes = totalStakes.add(breAirdrop);
        emit Whitelist(msg.sender, true);
    }

    function bet(uint256 _horseId, uint256 _amount) external nonReentrant {
        require(_amount > 0, "Invalid amount");

        BRE.safeTransferFrom(msg.sender, address(this), _amount);

        betInfos[horseId][msg.sender] = betInfos[horseId][msg.sender].add(
            breAirdrop
        );
        totalStakeById[horseId] = totalStakeById[horseId].add(breAirdrop);
        totalStakes = totalStakes.add(breAirdrop);
        emit Stake(msg.sender, _horseId, _amount);
    }

    function claim() external nonReentrant {
        uint256 _stakes = betInfos[winHorseId][msg.sender];
        require(_stakes > 0, "The address is not a winner.");
        uint256 claimAmount = _stakes.div(totalStakeById[winHorseId]).mul(
            totalStakes
        );
        BRE.safeTransfer(msg.sender, claimAmount);

        emit Claim(msg.sender, winHorseId, claimAmount);
    }

    function breBalance() public view returns (uint256) {
        return BRE.balanceOf(address(this));
    }

    function withdraw(uint256 _amount) public onlyAdmin {
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
