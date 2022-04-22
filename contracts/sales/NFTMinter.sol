// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "./interface/IMedievalNFT.sol";
import "../interfaces/IAdmin.sol";
import "../math/SafeMath.sol";

contract NFTMinter is ReentrancyGuard {

    using ECDSA for bytes32;
    using SafeMath for *;

    IMedievalNFT immutable public nft;
    IAdmin public admin;

    // price
    uint256 public counter;

    // voucher exchanged
    uint256 public numberOfVoucher;
    // whitelist sold
    uint256 public numberOfWhitelist;

    // mapping if user is participated or not
    mapping(address => bool) public isParticipated;
    mapping(address => bool) public VoucherUsed;

    modifier onlyAdmin() {
        require(
            admin.isAdmin(msg.sender),
            "Only admin can call this function."
        );
        _;
    }

    constructor (
        address _admin,
        address _nft
    ) public {
        require(_admin != address(0), "_admin != address(0)");
        admin = IAdmin(_admin);
        nft = IMedievalNFT(_nft);
    }

    function mint(uint256 price, uint256 amount, bytes memory signature) external nonReentrant payable {
        require(counter >= amount, "The current batch has been sold out!");
        require(!isParticipated[msg.sender], "User can mint only once.");

        uint256 value = msg.value;
        require(value == price * amount, "Incorrect ETH Amount.");

        require(
            checkMintSignature(signature, msg.sender, price, amount),
            "Invalid mint signature. Verification failed"
        );

        nft.mint(msg.sender, amount);
        numberOfWhitelist = numberOfWhitelist.add(amount);
        isParticipated[msg.sender] = true;
        counter = counter.sub(amount);
    }


    function mintWithVoucher(bytes memory signature) external nonReentrant {
        require(
            checkVoucherSignature(signature, msg.sender),
            "Invalid voucher signature. Verification failed"
        );
        // Check user haven't participated before
        require(!VoucherUsed[msg.sender], "User can only use voucher once.");

        nft.mint(msg.sender, 1);

        // Mark user is participated
        VoucherUsed[msg.sender] = true;
        numberOfVoucher++;
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        require(success);
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
        bytes32 hash = keccak256(abi.encodePacked(user, price, amount, address(this)));
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    function checkVoucherSignature(
        bytes memory signature,
        address user
    ) public view returns (bool) {
        return admin.isAdmin(getVoucherSigner(signature, user));
    }

    function getVoucherSigner(
        bytes memory signature,
        address user
    ) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(user, address(this), 'voucher'));
        bytes32 messageHash = hash.toEthSignedMessageHash();
        return messageHash.recover(signature);
    }

    // function to withdraw earnings
    function withdrawEarnings() public onlyAdmin {
        // transfer
        safeTransferETH(msg.sender, address(this).balance);
    }

    function setBatchCounter(uint256 _counter) external onlyAdmin {
        counter = _counter;
    }

    function getBalance() public view returns (uint){
        return address(this).balance;
    }

    receive() external payable {}
}
