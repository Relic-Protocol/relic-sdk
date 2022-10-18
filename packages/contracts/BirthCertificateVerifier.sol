/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./lib/FactSigs.sol";
import "./lib/BirthCertificate.sol";
import "./interfaces/IReliquary.sol";

contract BirthCertificateVerifier {
    IReliquary immutable reliquary;

    constructor(IReliquary _reliquary) {
        reliquary = _reliquary;
    }

    function getBirthCertificate(address account) internal view returns (uint48, uint64) {
        (bool exists, , bytes memory data) = reliquary.verifyFactNoFee(
            account,
            FactSigs.birthCertificateFactSig()
        );
        require(exists, "account has no proven birth certificate");
        return BirthCertificate.parse(data);
    }

    function requireOlderThan(address account, uint256 age) internal view {
        (, uint64 birthTime) = getBirthCertificate(account);
        require(block.timestamp - birthTime > age, "account is not old enough");
    }

    function requireOlderThanBlocks(address account, uint256 age) internal view {
        (uint48 birthBlock, ) = getBirthCertificate(account);
        require(block.number - birthBlock > age, "account is not old enough");
    }

    function requireBornBefore(address account, uint256 timestamp) internal view {
        (, uint64 birthTime) = getBirthCertificate(account);
        require(birthTime < timestamp, "account is not old enough");
    }

    function requireBornBeforeBlock(address account, uint256 blockNum) internal view {
        (uint48 birthBlock, ) = getBirthCertificate(account);
        require(birthBlock < blockNum, "account is not old enough");
    }

    modifier onlyOlderThan(uint256 age) {
        requireOlderThan(msg.sender, age);
        _;
    }

    modifier onlyOlderThanBlocks(uint256 age) {
        requireOlderThanBlocks(msg.sender, age);
        _;
    }

    modifier onlyBornBefore(uint256 timestamp) {
        requireBornBefore(msg.sender, timestamp);
        _;
    }

    modifier onlyBornBeforeBlock(uint256 blockNum) {
        requireBornBeforeBlock(msg.sender, blockNum);
        _;
    }
}
