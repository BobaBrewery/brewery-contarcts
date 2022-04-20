pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MedievalNFT is ERC721, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    bytes32 private constant NFT_MINTER_ROLE = keccak256("NFT_MINTER_ROLE");

    constructor() ERC721("MedievalNFT", "NFT") public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function mint(address to, uint256 quantity) public {
        require(hasRole(NFT_MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(quantity >= 1, "quantity should over 1");

        while (quantity != 0) {
            quantity -= 1;
            _tokenIds.increment();
            uint256 newItemId = _tokenIds.current();
            _mint(to, newItemId);
        }
    }
}
