/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../lib/Facts.sol";

interface IBirthCertificateProver {
    function BIRTH_CERTIFICATE_SIG() external view returns (FactSignature);

    function blockHistory() external view returns (address);

    function proveBirthCertificate(
        address account,
        bytes memory accountProof,
        bytes memory header,
        bytes memory blockProof
    ) external payable;
}
