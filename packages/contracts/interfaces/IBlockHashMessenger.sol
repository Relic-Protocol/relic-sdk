/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface IBlockHashMessenger {
    function sendBlockHash(
        address destination,
        bytes calldata params,
        uint256 number,
        bytes32 blockHash,
        bytes calldata proof
    ) external payable;
}
