/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./IBlockHistory.sol";

/**
 * @title Block history provider
 * @author Theori, Inc.
 * @notice IBlockHistory provides a way to verify a blockhash
 */

interface IProxyBlockHistory is IBlockHistoryV0 {
    event TrustedBlockHash(uint256 number, bytes32 blockHash);

    /**
     * @notice Import a trusted block hash from the messenger
     * @param number the block number to import
     * @param hash the block hash
     */
    function importTrustedHash(uint256 number, bytes32 hash) external;
}
