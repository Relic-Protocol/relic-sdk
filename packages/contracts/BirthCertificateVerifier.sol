/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./lib/FactSigs.sol";
import "./lib/BirthCertificate.sol";
import "./interfaces/IReliquary.sol";

/**
 * @title BirthCertificateVerifier
 * @author Theori, Inc.
 * @notice Defines internal functions and modifiers for querying and verifying accounts'
 *         birth certificates.
 */
contract BirthCertificateVerifier {
    IReliquary immutable reliquary;

    constructor(IReliquary _reliquary) {
        reliquary = _reliquary;
    }

    /**
     * @notice Queries the Reliquary for a birth certificate. Reverts if it does not exist.
     *         Returns the block number and timestamp of account creation.
     * @param account the account to query
     */
    function getBirthCertificate(address account) internal view returns (uint48, uint64) {
        (bool exists, , bytes memory data) = reliquary.verifyFactNoFee(
            account,
            FactSigs.birthCertificateFactSig()
        );
        require(exists, "account has no proven birth certificate");
        return BirthCertificate.parse(data);
    }

    /**
     * @notice Reverts if the account has not proven its age is at least the provided value.
     * @param account the account to query
     * @param age the age (in seconds)
     */
    function requireOlderThan(address account, uint256 age) internal view {
        (, uint64 birthTime) = getBirthCertificate(account);
        require(block.timestamp - birthTime > age, "account is not old enough");
    }

    /**
     * @notice Reverts if the account has not proven its age is at least the provided value.
     * @param account the account to query
     * @param age the age (in blocks)
     */
    function requireOlderThanBlocks(address account, uint256 age) internal view {
        (uint48 birthBlock, ) = getBirthCertificate(account);
        require(block.number - birthBlock > age, "account is not old enough");
    }

    /**
     * @notice Reverts if the account has not proven it was before the given time.
     * @param account the account to query
     * @param timestamp the cutoff timestamp (in seconds)
     */
    function requireBornBefore(address account, uint256 timestamp) internal view {
        (, uint64 birthTime) = getBirthCertificate(account);
        require(birthTime < timestamp, "account is not old enough");
    }

    /**
     * @notice Reverts if the account has not proven it was before the given block number
     * @param account the account to query
     * @param blockNum the cutoff block number
     */
    function requireBornBeforeBlock(address account, uint256 blockNum) internal view {
        (uint48 birthBlock, ) = getBirthCertificate(account);
        require(birthBlock < blockNum, "account is not old enough");
    }

    /**
     * @notice Modifier version of requireOlderThan(msg.sender, age)
     * @param age the age (in seconds)
     */
    modifier onlyOlderThan(uint256 age) {
        requireOlderThan(msg.sender, age);
        _;
    }

    /**
     * @notice Modifier version of requireOlderThanBlocks(msg.sender, age)
     * @param age the age (in blocks)
     */
    modifier onlyOlderThanBlocks(uint256 age) {
        requireOlderThanBlocks(msg.sender, age);
        _;
    }

    /**
     * @notice Modifier version of requireBornBefore(msg.sender, timestamp)
     * @param timestamp the cutoff timestamp (in seconds)
     */
    modifier onlyBornBefore(uint256 timestamp) {
        requireBornBefore(msg.sender, timestamp);
        _;
    }

    /**
     * @notice Modifier version of requireBornBeforeBlock(msg.sender, blockNum)
     * @param blockNum the cutoff block number
     */
    modifier onlyBornBeforeBlock(uint256 blockNum) {
        requireBornBeforeBlock(msg.sender, blockNum);
        _;
    }
}
