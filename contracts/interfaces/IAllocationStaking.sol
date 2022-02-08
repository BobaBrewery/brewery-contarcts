//"SPDX-License-Identifier: UNLICENSED"
pragma solidity 0.6.12;

interface IAllocationStaking {
    function deposited(uint256 _pid, address _user) external view returns (uint256);
    function setTokensUnlockTime(uint256 _pid, address _user, uint256 _tokensUnlockTime) external;

}
