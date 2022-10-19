/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

/**
 * @title BirthCertificate
 * @author Theori, Inc.
 * @notice Helper functions for handling birth certificate facts
 */
library BirthCertificate {
    /**
     * @notice parse a birth certificate fact
     * @param data the stored fact data
     * @return blockNum the blockNum from the birth certificate
     * @return time the timestamp from the birth certificate
     */
    function parse(bytes memory data) internal pure returns (uint48 blockNum, uint64 time) {
        require(data.length == 14);
        assembly {
            let word := mload(add(data, 0x20))
            blockNum := shr(208, word)
            time := shr(192, shl(48, word))
        }
    }
}
