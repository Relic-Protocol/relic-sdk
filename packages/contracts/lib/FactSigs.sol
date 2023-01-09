/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "./Facts.sol";

/**
 * @title FactSigs
 * @author Theori, Inc.
 * @notice Helper functions for computing fact signatures
 */
library FactSigs {
    /**
     * @notice Produce the fact signature data for birth certificates
     */
    function birthCertificateFactSigData() internal pure returns (bytes memory) {
        return abi.encode("BirthCertificate");
    }

    /**
     * @notice Produce the fact signature for a birth certificate fact
     */
    function birthCertificateFactSig() internal pure returns (FactSignature) {
        return Facts.toFactSignature(Facts.NO_FEE, birthCertificateFactSigData());
    }

    /**
     * @notice Produce the fact signature data for a storage slot fact
     * @param slot the account's slot
     * @param blockNum the block number to look at
     */
    function storageSlotFactSigData(bytes32 slot, uint256 blockNum)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode("StorageSlot", slot, blockNum);
    }

    /**
     * @notice Produce a fact signature for a storage slot
     * @param slot the account's slot
     * @param blockNum the block number to look at
     */
    function storageSlotFactSig(bytes32 slot, uint256 blockNum)
        internal
        pure
        returns (FactSignature)
    {
        return Facts.toFactSignature(Facts.NO_FEE, storageSlotFactSigData(slot, blockNum));
    }

    /**
     * @notice Produce the fact signature datat for an event fact
     * @param eventId The event in question
     */
    function eventFactSigData(uint64 eventId) internal pure returns (bytes memory) {
        return abi.encode("EventAttendance", "EventID", eventId);
    }

    /**
     * @notice Produce a fact signature for a given event
     * @param eventId The event in question
     */
    function eventFactSig(uint64 eventId) internal pure returns (FactSignature) {
        return Facts.toFactSignature(Facts.NO_FEE, eventFactSigData(eventId));
    }
}