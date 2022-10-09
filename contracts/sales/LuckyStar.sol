// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IAdmin.sol";
import "../libraries/UniversalERC20.sol";

contract LuckyStar is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using UniversalERC20 for IERC20;

    struct PeriodInfo {
        uint256 price;
        uint256 counter;
        uint256 curCode;
        uint256 endTime;
        bool isClaim;
        mapping(uint256 => address) codeInfos;
        mapping(address => uint256[]) buyInfos;
        mapping(address => bool) refundInfos;
    }

    struct Record {
        bytes32 roundHash;
        bool isUsed;
    }

    IAdmin public admin;
    IERC20 public Token;
    address Funder;
    uint256[] temp;
    mapping(uint256 => mapping(uint256 => PeriodInfo)) public poolInfos;
    mapping(uint256 => mapping(uint256 => Record)) public orders;

    event Activate(
        uint256 indexed poolId,
        uint256 indexed periodId,
        uint256 price,
        uint256 counter,
        uint256 endTime
    );
    event Claim(
        uint256 indexed poolId,
        uint256 indexed periodId,
        uint256 luckyCode,
        address user,
        uint256 tokenAmount,
        bool isClaim
    );
    event Participate(
        uint256 indexed poolId,
        uint256 indexed periodId,
        address user,
        uint256[] luckyCodes,
        uint256 leftover
    );
    event Refund(
        uint256 indexed poolId,
        uint256 indexed periodId,
        address user,
        uint256 amount
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
        address _token,
        address _funder
    ) public Ownable() {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        Token = IERC20(_token);
        Funder = _funder;
    }

    function buy(
        uint256 _poolId,
        uint256 _periodId,
        uint256 _amount
    ) external nonReentrant {
        require(_amount > 0, "Invalid amount");
        PeriodInfo storage poolInfo = poolInfos[_poolId][_periodId];
        require(!poolInfo.isClaim, "This period has archived.");
        require(poolInfo.endTime >= block.timestamp, "This period has ended");
        require(poolInfo.counter >= _amount, "This period has been sold out!");

        temp = poolInfo.buyInfos[msg.sender];
        for (uint256 i = 0; i < _amount; i++) {
            poolInfo.codeInfos[poolInfo.curCode] = msg.sender;
            temp.push(poolInfo.curCode);
            poolInfo.curCode = poolInfo.curCode.add(1);
        }
        poolInfo.buyInfos[msg.sender] = temp;
        poolInfo.counter = poolInfo.counter.sub(_amount);

        Token.safeTransferFrom(msg.sender, Funder, poolInfo.price.mul(_amount));
        emit Participate(
            _poolId,
            _periodId,
            msg.sender,
            poolInfo.buyInfos[msg.sender],
            poolInfo.counter
        );
    }

    function claim(
        uint256 _poolId,
        uint256 _periodId,
        uint256 _luckyCode,
        uint256 _tokenAmount,
        bytes calldata _signature
    ) external nonReentrant {
        require(
            checkMintSignature(
                _signature,
                msg.sender,
                _poolId,
                _periodId,
                _luckyCode,
                _tokenAmount
            ),
            "Invalid mint signature. Verification failed"
        );
        PeriodInfo storage poolInfo = poolInfos[_poolId][_periodId];
        require(!poolInfo.isClaim, "This period has archived.");
        require(poolInfo.counter == 0, "This period is not yet sold out.");
        require(
            poolInfo.buyInfos[msg.sender].length > 0,
            "Refunds were made in this period."
        );

        poolInfo.isClaim = true;
        Token.universalTransfer(msg.sender, _tokenAmount);

        emit Claim(
            _poolId,
            _periodId,
            _luckyCode,
            msg.sender,
            _tokenAmount,
            poolInfo.isClaim
        );
    }

    function refund(uint256 _poolId, uint256 _periodId) external nonReentrant {
        PeriodInfo storage poolInfo = poolInfos[_poolId][_periodId];
        require(!poolInfo.isClaim, "This period has archived.");
        require(
            block.timestamp > poolInfo.endTime,
            "This period is not yet closed for sale."
        );

        uint256 refundAmount = poolInfo.buyInfos[msg.sender].length;
        require(
            refundAmount > 0,
            "Not participating in this period, or refunded."
        );
        poolInfo.refundInfos[msg.sender] = true;
        delete poolInfo.buyInfos[msg.sender];
        Token.universalTransfer(msg.sender, poolInfo.price.mul(refundAmount));

        emit Refund(_poolId, _periodId, msg.sender, refundAmount);
    }

    function activate(
        uint256 _poolId,
        uint256 _periodId,
        uint256 _price,
        uint256 _count,
        uint256 _endTime
    ) external nonReentrant onlyOwner {
        PeriodInfo storage poolInfo = poolInfos[_poolId][_periodId];
        require(!poolInfo.isClaim, "This period has archived.");
        require(poolInfo.endTime == 0, "This period has exist.");
        poolInfo.price = _price;
        poolInfo.counter = _count;
        poolInfo.curCode = 10000001;
        poolInfo.endTime = _endTime;

        emit Activate(_poolId, _periodId, _price, _count, _endTime);
    }

    function archive(
        uint256 _poolId,
        uint256 _periodId,
        bytes32 _roundHash
    ) public onlyOwner {
        require(!orders[_poolId][_periodId].isUsed, "Record was archived.");
        require(_roundHash != 0, "Invalid roundHash value");
        orders[_poolId][_periodId] = Record({
            roundHash: _roundHash,
            isUsed: true
        });
    }

    function rescueFunds(IERC20 token, uint256 amount) external onlyAdmin {
        token.universalTransfer(payable(Funder), amount);
    }

    function pause() external onlyAdmin {
        _pause();
    }

    function getUserByCode(
        uint256 _poolId,
        uint256 _periodId,
        uint256 _luckyCode
    ) public view returns (address) {
        return poolInfos[_poolId][_periodId].codeInfos[_luckyCode];
    }

    function getCodesByUser(
        uint256 _poolId,
        uint256 _periodId,
        address _user
    ) public view returns (uint256[] memory) {
        return poolInfos[_poolId][_periodId].buyInfos[_user];
    }

    function getRefundStates(
        uint256 _poolId,
        uint256 _periodId,
        address _user
    ) public view returns (bool) {
        return poolInfos[_poolId][_periodId].refundInfos[_user];
    }

    function checkMintSignature(
        bytes calldata _signature,
        address _user,
        uint256 _poolId,
        uint256 _periodId,
        uint256 _luckyCode,
        uint256 _amount
    ) public view returns (bool) {
        return
            admin.isAdmin(
                getMintSigner(
                    _signature,
                    _user,
                    _poolId,
                    _periodId,
                    _luckyCode,
                    _amount
                )
            );
    }

    function getMintSigner(
        bytes calldata _signature,
        address _user,
        uint256 _poolId,
        uint256 _periodId,
        uint256 _luckyCode,
        uint256 _amount
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                _user,
                _poolId,
                _periodId,
                _luckyCode,
                _amount,
                address(this)
            )
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(_signature);
    }

    receive() external payable {}
}
