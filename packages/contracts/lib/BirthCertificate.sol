/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

library BirthCertificate {
    function parse(bytes memory data) internal pure returns (uint48 blockNum, uint64 time) {
        require(data.length == 14);
        assembly {
            let word := mload(add(data, 0x20))
            blockNum := shr(208, word)
            time := shr(192, shl(48, word))
        }
    }
}
