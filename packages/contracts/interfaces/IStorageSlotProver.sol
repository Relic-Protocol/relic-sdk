/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

interface IStorageSlotProver {
    function blockHistory() external view returns (address);

    function proveAndStoreStorageSlot(
        address account,
        bytes memory accountProof,
        bytes32 slot,
        bytes memory slotProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable returns (uint256 blockNum, bytes memory value);

    function proveStorageSlot(
        address account,
        bytes memory accountProof,
        bytes32 slot,
        bytes memory slotProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable returns (uint256, bytes memory);
}
