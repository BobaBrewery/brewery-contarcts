// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interface/IERC1155NFTPublic.sol";
import "../../../interfaces/IAdmin.sol";

contract CyberPopMinter is ReentrancyGuard {
    using ECDSA for bytes32;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC1155NFTPublic public immutable propNft;
    IAdmin public admin;
    uint256 public totalTokensDeposited;

    // Is participated?
    mapping(address => bool) public wlParticipated;
    // left nft amount
    mapping(uint256 => uint256) public propCounters;

    event PropMinted(address buyer, uint256 amount);

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor(address _admin, address _propNft) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        propNft = IERC1155NFTPublic(_propNft);
        propCounters[2] = 3000;
    }

    function freeMint(
        uint256 id,
        uint256 amount,
        bytes memory data,
        bytes memory signature
    ) external nonReentrant {
        require(!wlParticipated[msg.sender], "User can mint wl only once.");
        require(propCounters[id] >= amount, "The current batch has been sold out!");
        require(
            checkMintSignature(signature, msg.sender, 0, amount, "prop"),
            "Invalid mint signature. Verification failed"
        );
        propNft.mint(msg.sender, id, amount, data);
        wlParticipated[msg.sender] = true;
        propCounters[id] = propCounters[id].sub(amount);
        emit PropMinted(msg.sender, amount);
    }

    // Function to check if admin was the message signer
    function checkMintSignature(
        bytes memory signature,
        address user,
        uint256 price,
        uint256 amount,
        string memory nftType
    ) public view returns (bool) {
        return admin.isAdmin(getMintSigner(signature, user, price, amount, nftType));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getMintSigner(
        bytes memory signature,
        address user,
        uint256 price,
        uint256 amount,
        string memory nftType
    ) public view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(user, price, amount, address(this), nftType)
        );
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    receive() external payable {}
}
