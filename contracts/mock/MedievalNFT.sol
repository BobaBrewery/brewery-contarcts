pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MedievalNFT is ERC721, AccessControl {
    bytes32 private constant NFT_MINTER_ROLE = keccak256("NFT_MINTER_ROLE");

    constructor() ERC721("MedievalNFT", "NFT") public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }


    function mint(address to, uint256 tokenId) public {
        require(hasRole(NFT_MINTER_ROLE, msg.sender), "Caller is not a minter");
        _safeMint(to, tokenId, "");
    }
}
