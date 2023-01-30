/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import './lib/CoreTypes.sol';
import './lib/Facts.sol';
import './lib/FactSigs.sol';
import './lib/Storage.sol';
import './lib/BirthCertificate.sol';
import './interfaces/IRelicReceiver.sol';
import './interfaces/IEphemeralFacts.sol';

/**
 * @title RelicReceiver
 * @author Theori, Inc.
 * @notice
 */
abstract contract RelicReceiver is IRelicReceiver {
    IEphemeralFacts immutable ephemeralFacts;

    constructor(IEphemeralFacts _ephemeralFacts) {
        ephemeralFacts = _ephemeralFacts;
    }

    /**
     * @notice Handler for receiving ephemeral storage slot facts.
     * @dev By default, handling storage facts is unimplemented and will revert.
     *      Subcontracts should override this function if desired.
     * @param initiator the address which initiated the fact proving
     * @param account the account for the storage slot
     * @param slot the slot index
     * @param blockNum the block number of the fact
     * @param value the value contained in the slot
     */
    function receiveStorageSlotFact(
        address initiator,
        address account,
        bytes32 slot,
        uint256 blockNum,
        bytes32 value
    ) internal virtual {
        initiator; account; slot; blockNum; value; // silence warnings
        revert('Unimplemented: receiveStorageSlotFact');
    }

    /**
     * @notice Handler for receiving ephemeral birth certificate facts.
     * @dev By default, handling birth certificates is unimplemented and will revert.
     *      Subcontracts should override this function if desired.
     * @param initiator the address which initiated the fact proving
     * @param account the account for the storage slot
     * @param blockNum the block number of the birth certificate
     * @param timestamp the timestamp of the birth certificate
     */
    function receiveBirthCertificateFact(
        address initiator,
        address account,
        uint256 blockNum,
        uint256 timestamp
    ) internal virtual {
        initiator; account; blockNum; timestamp; // silence warnings
        revert('Unimplemented: receiveBirthCertificateFact');
    }

    /**
     * @notice Handler for receiving ephemeral log facts.
     * @dev By default, handling log facts is unimplemented and will revert.
     *      Subcontracts should override this function if desired.
     * @param initiator the address which initiated the fact proving
     * @param account the account which emitted the log
     * @param blockNum the block number of the log
     * @param txIdx the index of the transaction in the block
     * @param logIdx the index of the log in the transaction
     * @param log the log data
     */
    function receiveLogFact(
        address initiator,
        address account,
        uint256 blockNum,
        uint256 txIdx,
        uint256 logIdx,
        CoreTypes.LogData memory log
    ) internal virtual {
        initiator; account; blockNum; txIdx; logIdx; log; // silence warnings
        revert('Unimplemented: receiveLogFact');
    }

    /**
     * @notice Handler for receiving block header facts.
     * @dev By default, handling block header facts is unimplemented and will revert.
     *      Subcontracts should override this function if desired.
     * @param initiator the address which initiated the fact proving
     * @param blockNum the block number of the log
     * @param header the block header data
     */
    function receiveBlockHeaderFact(
        address initiator,
        uint256 blockNum,
        CoreTypes.BlockHeaderData memory header
    ) internal virtual {
        initiator; blockNum; header; // silence warnings
        revert('Unimplemented: receiveBlockHeaderFact');
    }

    /**
     * @notice receives an ephemeral fact from Relic
     * @param initiator the account which initiated the fact proving
     * @param fact the proven fact information
     * @param data extra data passed from the initiator - this contract requires it to be
     *             the fact signature data, so that we can identify the fact type and parse
     *             the fact parameters.
     */
    function receiveFact(address initiator, Fact calldata fact, bytes calldata data) external {
        require(
            msg.sender == address(ephemeralFacts),
            'only EphemeralFacts can call receiveFact'
        );

        // validate data matches the received fact signature
        FactSignature computedSig = Facts.toFactSignature(Facts.NO_FEE, data);
        require(
            FactSignature.unwrap(fact.sig) == FactSignature.unwrap(computedSig),
            'extra data does not match fact signature'
        );

        bytes32 nameHash = keccak256(abi.decode(data, (bytes)));
        if (nameHash == keccak256('BirthCertificate')) {
            (uint48 blockNum, uint64 timestamp) = BirthCertificate.parse(
                fact.data
            );
            receiveBirthCertificateFact(initiator, fact.account, blockNum, timestamp);
        } else if (nameHash == keccak256('StorageSlot')) {
            (, bytes32 slot, uint256 blockNum) = abi.decode(
                data,
                (bytes, bytes32, uint256)
            );
            bytes32 value = bytes32(Storage.parseUint256(fact.data));
            receiveStorageSlotFact(initiator, fact.account, slot, blockNum, value);
        } else if (nameHash == keccak256('Log')) {
            (, uint256 blockNum, uint256 txIdx, uint256 logIdx) = abi.decode(
                data,
                (bytes, uint256, uint256, uint256)
            );
            CoreTypes.LogData memory log = abi.decode(
                fact.data,
                (CoreTypes.LogData)
            );
            receiveLogFact(initiator, fact.account, blockNum, txIdx, logIdx, log);
        } else if (nameHash == keccak256('BlockHeader')) {
            (, uint256 blockNum) = abi.decode(data, (bytes, uint256));
            CoreTypes.BlockHeaderData memory header = abi.decode(
                fact.data,
                (CoreTypes.BlockHeaderData)
            );
            receiveBlockHeaderFact(initiator, blockNum, header);
        } else {
            revert("unsupported fact type");
        }
    }
}