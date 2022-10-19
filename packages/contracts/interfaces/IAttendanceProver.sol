/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../lib/Facts.sol";

/**
 * @title Prover for attendance/participation
 * @notice IAttendanceProver verifies statements signed by trusted sources
 *         to assign attendance Artifacts to accounts
 */
interface IAttendanceProver {
    /**
     * @notice Emitted when a new event which may be attended is created
     * @param eventId The unique id of this event
     * @param deadline The timestamp after which no further attendance requests
     *        will be processed
     * @param factSig The fact signature of this particular event
     */
    event NewEvent(uint64 eventId, uint48 deadline, FactSignature factSig);

    /**
     * @notice Add a new event which may be attended
     * @param eventId The unique eventId for the new event
     * @param signer The address for the signer which attests the claim code
     *        is valid
     * @param deadline The timestamp after which no further attendance requests
     *        will be processed
     * @param capacity The initial maximum number of attendees which can claim codes
     * @dev Emits NewEvent
     */
    function addEvent(
        uint64 eventId,
        address signer,
        uint48 deadline,
        uint32 capacity
    ) external;

    /**
     * @notice Prove attendance for an event and claim the associated conveyances
     * @param account The account making the claim of attendance
     * @param eventId The event which was attended
     * @param number The unique id which may be redeemed only once from the event
     * @param signatureInner The signature attesting that the number and eventId are valid
     * @param signatureOuter The signature attesting that the account is the claimer of
     *        the presented information
     * @dev Issues a fact in the Reliquary with the fact signature for this event
     * @dev Issues a soul-bound NFT Artifact for attending the event
     */
    function claim(
        address account,
        uint64 eventId,
        uint64 number,
        bytes memory signatureInner,
        bytes memory signatureOuter
    ) external payable;

    function events(uint64)
        external
        view
        returns (
            address signer,
            uint32 capacity,
            uint48 deadline
        );

    /**
     * @notice Increase the capacity of an existing event. Only callable by the
               contract owner.
     * @param eventId The unique eventId for the new event
     *        is valid
     * @param newCapacity the new maximum number of attendees which can claim codes
     * @dev Emits NewEvent
     */
    function increaseCapacity(uint64 eventId, uint32 newCapacity) external;

    function outerSigner() external view returns (address);

    /**
     * @notice Sets the signer for the attestation that a request was made
     *         by a particular account. Only callable by the contract owner.
     * @param _outerSigner The address corresponding to the signer
     */
    function setOuterSigner(address _outerSigner) external;
}
