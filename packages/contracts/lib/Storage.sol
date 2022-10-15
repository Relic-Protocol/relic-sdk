/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

library Storage {
    function mapElemSlot(bytes32 base, bytes32 key) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(key, base));
    }

    function staticArrayElemSlot(
        bytes32 base,
        uint256 idx,
        uint256 slotsPerElem
    ) internal pure returns (bytes32) {
        return bytes32(uint256(base) + idx * slotsPerElem);
    }

    function dynamicArrayElemSlot(
        bytes32 base,
        uint256 idx,
        uint256 slotsPerElem
    ) internal pure returns (bytes32) {
        return bytes32(uint256(keccak256(abi.encode(base))) + idx * slotsPerElem);
    }

    function structFieldSlot(
        bytes32 base,
        uint256 offset
    ) internal pure returns (bytes32) {
        return bytes32(uint256(base) + offset);
    }

    function parseAddress(bytes memory data) internal pure returns (address) {
        return address(bytes20(data));
    }

    function parseUint256(bytes memory data) internal pure returns (uint256) {
        return uint256(bytes32(data));
    }

    function parseUint64(bytes memory data) internal pure returns (uint64) {
        return uint64(bytes8(bytes32(uint256(bytes32(data)) << 192)));
    }
}
