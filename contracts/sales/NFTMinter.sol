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
    uint256 public ethAmount;
    uint256 public counter;
    uint256 public maxQuantity;

    // voucher
    uint256 public numberOfVoucher;
    // whitelist
    uint256 public numberOfWhitelist;

    // mapping if user is participated or not
    mapping(address => bool) public isParticipated;

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
        maxQuantity = 5;
    }

    function mint(uint256 quantity, bytes memory signature) external nonReentrant payable {
        require(quantity <= maxQuantity, "Exceed Max Quantity");
        require(counter >= quantity, "The current batch has been sold out!");

        uint256 value = msg.value;
        require(value == ethAmount * quantity, "Incorrect ETH Amount.");

        require(
            checkParticipationSignature(signature, msg.sender, ethAmount),
            "Invalid whitelist signature. Verification failed"
        );

        payable(address(this)).transfer(value);

        nft.mint(msg.sender, quantity);
        numberOfWhitelist = numberOfWhitelist.add(quantity);
        counter = counter.sub(quantity);
    }


    function mintWithVoucher(bytes memory signature) external nonReentrant {
        require(
            checkVoucherSignature(signature, msg.sender),
            "Invalid voucher signature. Verification failed"
        );
        // Check user haven't participated before
        require(!isParticipated[msg.sender], "User can participate only once.");

        nft.mint(msg.sender, 1);

        // Mark user is participated
        isParticipated[msg.sender] = true;
        numberOfVoucher++;
    }

    function mintWithVoucherTest(bytes memory signature, uint tokenID) external nonReentrant {
        require(
            checkVoucherSignature(signature, msg.sender),
            "Invalid voucher signature. Verification failed"
        );
        // Check user haven't participated before
        require(!isParticipated[msg.sender], "User can participate only once.");

        nft.mint(msg.sender, tokenID);

        // Mark user is participated
        isParticipated[msg.sender] = true;
        numberOfVoucher++;
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        require(success);
    }

    // Function to check if admin was the message signer
    function checkParticipationSignature(
        bytes memory signature,
        address user,
        uint256 price
    ) public view returns (bool) {
        return admin.isAdmin(getParticipationSigner(signature, user, price));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    function getParticipationSigner(
        bytes memory signature,
        address user,
        uint256 price
    ) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(user, price, address(this)));
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

    function setPrice(
        uint256 _ethAmount, uint256 _counter) external onlyAdmin {
        ethAmount = _ethAmount;
        counter = _counter;
    }

    function setMaxQuantity(uint256 _maxQuantity) external onlyAdmin {
        maxQuantity = _maxQuantity;
    }

    function getBalance() public view returns (uint){
        return address(this).balance;
    }

    receive() external payable {}
}
