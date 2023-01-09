/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../lib/Storage.sol";

contract StorageParseTest {
    constructor() {}

    function testParseUint256(bytes memory data) external pure returns (uint256) {
        return Storage.parseUint256(data);
    }

    function testParseUint64(bytes memory data) external pure returns (uint64) {
        return Storage.parseUint64(data);
    }

    function testParseAddress(bytes memory data) external pure returns (address) {
        return Storage.parseAddress(data);
    }
}
