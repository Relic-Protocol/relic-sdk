/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

/**
 * @title IStorageSlotProver
 * @author Theori, Inc.
 * @notice IStorageSlotProver proves that a storage slot had a particular value
 *         at a particular block.
 */
interface IStorageSlotProver {
    function blockHistory() external view returns (address);

    /**
     * @notice Proves that a storage slot had a particular value at a particular
     *         block, and stores this fact in the reliquary.
     *
     * @param account the account to prove exists
     * @param accountProof the Merkle-Patricia trie proof for the account
     * @param slot the storage slot index
     * @param slotProof the Merkle-Patricia trie proof for the slot
     * @param header the block header, RLP encoded
     * @param blockProof proof that the block header is valid
     * @return blockNum the block number from the header
     * @return value the bytes value of the data in the slot
     */
    function proveAndStoreStorageSlot(
        address account,
        bytes memory accountProof,
        bytes32 slot,
        bytes memory slotProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable returns (uint256 blockNum, bytes memory value);

    /**
     * @notice Proves that a storage slot had a particular value at a particular
     *         block. Returns the block number and bytes value of the slot.
     *
     * @param account the account to prove exists
     * @param accountProof the Merkle-Patricia trie proof for the account
     * @param slot the storage slot index
     * @param slotProof the Merkle-Patricia trie proof for the slot
     * @param header the block header, RLP encoded
     * @param blockProof proof that the block header is valid
     */
    function proveStorageSlot(
        address account,
        bytes memory accountProof,
        bytes32 slot,
        bytes memory slotProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable returns (uint256, bytes memory);
}
