// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;


import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IMedievalNFT.sol";

contract NFTMinter is ReentrancyGuard, Ownable {
    IMedievalNFT immutable public nft;

    //price
    uint256 public ethAmount;
    uint256 public counter;
    uint256 public maxQuantity;

    event UseReferalCode(uint256 quantity, bytes32 code);

    constructor (
        address _nft
    ) public {
        nft = IMedievalNFT(_nft);
        maxQuantity = 5;
    }

    function mint(uint256 quantity, bytes32 code) external nonReentrant payable {
        require(quantity <= maxQuantity, "Exceed Max Quantity");
        require(counter >= quantity, "The current batch has been sold out!");

        uint256 value = msg.value;

        require(value >= ethAmount * quantity, "Incorrect ETH Amount.");
        payable(address(this)).transfer(value);

        nft.mint(msg.sender, quantity);
        counter -= quantity;

        emit UseReferalCode(quantity, code);
    }

    function safeTransferETH(address to, uint256 value) internal {
        (bool success,) = to.call{value : value}(new bytes(0));
        require(success);
    }

    // function to withdraw earnings
    function withdrawEarnings() public onlyOwner {
        // transfer
        safeTransferETH(msg.sender, address(this).balance);
    }


    function setPrice(
        uint256 _ethAmount, uint256 _counter) external onlyOwner {
        ethAmount = _ethAmount;
        counter = _counter;
    }

    function setMaxQuantity(uint256 _maxQuantity) external onlyOwner {
        maxQuantity = _maxQuantity;
    }

    function getBalance() public view returns(uint){
        return address(this).balance;
    }

    receive() external payable {}
}
