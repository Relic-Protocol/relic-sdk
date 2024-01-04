/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

/**
 * @title Block history provider
 * @author Theori, Inc.
 * @notice IBlockHistory provides a way to verify a blockhash
 */

interface IBlockHistoryBase {
    /**
     * @notice Determine if the given hash corresponds to the given block
     * @param hash the hash if the block in question
     * @param num the number of the block in question
     * @param proof any witness data required to prove the block hash is
     *        correct (such as a Merkle or SNARK proof)
     * @return boolean indicating if the block hash can be verified correct
     */
    function validBlockHash(
        bytes32 hash,
        uint256 num,
        bytes calldata proof
    ) external view returns (bool);
}

interface IBlockHistoryV0 is IBlockHistoryBase {
    event ImportMerkleRoot(uint256 indexed index, bytes32 merkleRoot);
}

interface IBlockHistoryV1 is IBlockHistoryBase {
    event ImportMerkleRoot(uint256 indexed index, bytes32 merkleRoot, bytes32 auxiliaryRoot);

    function commitRecent(uint256 blockNum) external;
}

interface IBlockHistory is IBlockHistoryV1 { }
