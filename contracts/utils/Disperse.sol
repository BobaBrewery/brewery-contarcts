// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;


import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";


contract Disperse {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    constructor() public {}

    function disperseEther(address[] memory _recipients, uint256 _amount) external payable {
        uint256 totalAmount = _recipients.length.mul(_amount);
        require(msg.value == totalAmount, "Transfer amount error.");

        for (uint256 i = 0; i < _recipients.length; i++)
            payable(_recipients[i]).transfer(_amount);
    }

    function disperseToken(address _token, address[] memory _recipients, uint256[] memory _amounts) external {
        IERC20 token = IERC20(_token);
        require(_recipients.length == _amounts.length, "The number of recipients does not match the number of amounts.");
        for (uint256 i = 0; i < _recipients.length; i++)
            token.safeTransferFrom(msg.sender, _recipients[i], _amounts[i]);
    }

    function disperseTokenSimple(address _token, address[] memory _recipients, uint256 _amount) external {
        IERC20 token = IERC20(_token);
        for (uint256 i = 0; i < _recipients.length; i++)
            token.safeTransferFrom(msg.sender, _recipients[i], _amount);
    }
}