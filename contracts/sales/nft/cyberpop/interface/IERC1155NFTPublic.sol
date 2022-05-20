// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

interface IERC1155NFTPublic {
    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;

    function mintBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) external;
}
