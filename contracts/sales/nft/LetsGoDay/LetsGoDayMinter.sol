// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "../../../interfaces/IAdmin.sol";

contract LetsGoDayMinter is ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    address public immutable NFTHolder;
    IAdmin public immutable admin;
    IERC1155 public immutable ERC1155NFT;
    IERC20 public immutable TOKEN;
    uint256 private constant _PRICE = 20000000;

    // left nft amount
    mapping(uint256 => uint256) private _propCounters;

    event PropMinted(address buyer, uint256[] tokenId, uint256[] amount);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(
        address _admin,
        address _nftHolder,
        address _payToken,
        address _propNft
    ) public {
        admin = IAdmin(_admin);
        NFTHolder = _nftHolder;
        ERC1155NFT = IERC1155(_propNft);
        TOKEN = IERC20(_payToken);
        _propCounters[0] = 200;
        _propCounters[1] = 200;
        _propCounters[2] = 200;
        _propCounters[3] = 200;
        _propCounters[4] = 200;
        _propCounters[5] = 200;
        _propCounters[6] = 200;
        _propCounters[7] = 200;
        _propCounters[8] = 200;
        _propCounters[9] = 200;
    }

    function mint(
        uint256[] calldata _tokenIds,
        uint256[] calldata _amounts,
        bytes calldata data
    ) external nonReentrant {
        uint256 total_amount;
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            require(
                _propCounters[_tokenIds[i]] >= _amounts[i],
                "The tokenId you have purchased has been sold out!"
            );
            _propCounters[_tokenIds[i]] = _propCounters[_tokenIds[i]].sub(
                _amounts[i]
            );
            total_amount = total_amount.add(_amounts[i]);
        }
        TOKEN.safeTransferFrom(
            msg.sender,
            address(this),
            _PRICE.mul(total_amount)
        );
        ERC1155NFT.safeBatchTransferFrom(
            NFTHolder,
            msg.sender,
            _tokenIds,
            _amounts,
            data
        );

        emit PropMinted(msg.sender, _tokenIds, _amounts);
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

    function getRemainBytokenId(uint256 _tokenId)
        public
        view
        returns (uint256)
    {
        return _propCounters[_tokenId];
    }

    receive() external payable {}
}
