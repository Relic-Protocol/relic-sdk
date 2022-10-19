/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../lib/Facts.sol";

/**
 * @title IBirthCertificateProver
 * @author Theori, Inc.
 * @notice IBirthCertificateProver proves that an account existed in a given block
 *         and stores the oldest known account proof in the fact database
 */
interface IBirthCertificateProver {
    function BIRTH_CERTIFICATE_SIG() external view returns (FactSignature);

    function blockHistory() external view returns (address);

    /**
     * @notice Proves that an account existed in the given block. Stores the
     *         fact in the registry if the given block is the oldest block
     *         this account is known to exist in. Mints the account an SBT if
     *         this is the first proof.
     *
     * @param account the account to prove exists
     * @param accountProof the Merkle-Patricia trie proof for the account
     * @param header the block header, RLP encoded
     * @param blockProof proof that the block header is valid
     */
    function proveBirthCertificate(
        address account,
        bytes memory accountProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable;
}
