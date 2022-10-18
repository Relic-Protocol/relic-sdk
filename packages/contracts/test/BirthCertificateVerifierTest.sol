/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../BirthCertificateVerifier.sol";
import "../interfaces/IReliquary.sol";

contract BirthCertificateVerifierTest is BirthCertificateVerifier {
    constructor(IReliquary reliquary) BirthCertificateVerifier(reliquary) { }

    function testOlderThan(uint256 age) external onlyOlderThan(age) { }
    function testOlderThanBlocks(uint256 age) external onlyOlderThanBlocks(age) { }
    function testBornBefore(uint256 timestamp) external onlyBornBefore(timestamp) { }
    function testBornBeforeBlock(uint256 blockNum) external onlyBornBeforeBlock(blockNum) { }
}
