/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../lib/Facts.sol";

interface IAttendanceProver {
    event NewEvent(uint64 eventId, uint48 deadline, FactSignature factSig);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    function addEvent(
        uint64 eventId,
        address signer,
        uint48 deadline,
        uint32 capacity
    ) external;

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

    function increaseCapacity(uint64 eventId, uint32 newCapacity) external;

    function outerSigner() external view returns (address);

    function owner() external view returns (address);

    function renounceOwnership() external;

    function setOuterSigner(address _outerSigner) external;

    function transferOwnership(address newOwner) external;
}
