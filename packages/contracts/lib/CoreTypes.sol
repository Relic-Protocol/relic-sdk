/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

/**
 * @title CoreTypes
 * @author Theori, Inc.
 * @notice Data types and parsing functions for core types, including block headers
 *         and account data.
 */
library CoreTypes {
    struct BlockHeaderData {
        bytes32 ParentHash;
        address Coinbase;
        bytes32 Root;
        bytes32 TxHash;
        bytes32 ReceiptHash;
        uint256 Number;
        uint256 GasLimit;
        uint256 GasUsed;
        uint256 Time;
        bytes32 MixHash;
        uint256 BaseFee;
    }

    struct AccountData {
        uint256 Nonce;
        uint256 Balance;
        bytes32 StorageRoot;
        bytes32 CodeHash;
    }

    struct LogData {
        address Address;
        bytes32[] Topics;
        bytes Data;
    }
}
