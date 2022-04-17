// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IMedievalNFT.sol";
import "../interfaces/IAdmin.sol";

contract NFTMinter is ReentrancyGuard {
    IMedievalNFT immutable public nft;
    IAdmin public admin;

    //price
    uint256 public ethAmount;
    uint256 public counter;
    uint256 public maxQuantity;

    event UseReferalCode(uint256 quantity, bytes32 code);

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

    function mint(uint256 quantity, bytes32 code, bytes memory signature) external nonReentrant payable {
        require(quantity <= maxQuantity, "Exceed Max Quantity");
        require(counter >= quantity, "The current batch has been sold out!");

        uint256 value = msg.value;
        require(value >= ethAmount * quantity, "Incorrect ETH Amount.");

        require(
            checkParticipationSignature(signature, msg.sender, amount),
            "Invalid signature. Verification failed"
        );

        payable(address(this)).transfer(value);

        nft.mint(msg.sender, quantity);
        counter -= quantity;

        emit UseReferalCode(quantity, code);
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        require(success);
    }

    // Function to check if admin was the message signer
    function checkParticipationSignature(
        bytes memory signature,
        address user,
        uint256 amount
    ) public view returns (bool) {
        return admin.isAdmin(getParticipationSigner(signature, user, amount));
    }

    /// @notice     Check who signed the message
    /// @param      signature is the message allowing user to participate in sale
    /// @param      user is the address of user for which we're signing the message
    /// @param      amount is the maximal amount of tokens user can buy
    function getParticipationSigner(
        bytes memory signature,
        address user,
        uint256 amount
    ) public view returns (address) {
        bytes32 hash = keccak256(abi.encodePacked(user, amount, address(this)));
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
