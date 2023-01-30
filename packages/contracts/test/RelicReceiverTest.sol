/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import '../RelicReceiver.sol';

/**
 * @title RelicReceiverTest
 * @author Theori, Inc.
 * @notice
 */
contract RelicReceiverTest is RelicReceiver {
    constructor(IEphemeralFacts ephemeralFacts) RelicReceiver(ephemeralFacts) { }

    event StorageSlotFact(
        address initiator,
        address account,
        bytes32 slot,
        uint256 blockNum,
        bytes32 value
    );
    event BirthCertificateFact(
        address initiator,
        address account,
        uint256 blockNum,
        uint256 timestamp
    );
    event BlockHeaderFact(
        address initiator,
        uint256 blockNum,
        CoreTypes.BlockHeaderData header
    );

    function receiveStorageSlotFact(
        address initiator,
        address account,
        bytes32 slot,
        uint256 blockNum,
        bytes32 value
    ) internal override {
        emit StorageSlotFact(initiator, account, slot, blockNum, value);
    }

    function receiveBirthCertificateFact(
        address initiator,
        address account,
        uint256 blockNum,
        uint256 timestamp
    ) internal override {
        emit BirthCertificateFact(initiator, account, blockNum, timestamp);
    }

    function receiveBlockHeaderFact(
        address initiator,
        uint256 blockNum,
        CoreTypes.BlockHeaderData memory header
    ) internal override {
        emit BlockHeaderFact(initiator, blockNum, header);
    }
}