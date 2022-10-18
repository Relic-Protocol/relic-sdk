# Relic Contracts

## Usage

Once installed, you can use the contracts in the library by importing them in your solidity. For example,

```solidity
pragma solidity ^0.8.0;

import "@relicprotocol/contracts/BirthCertificateVerifier.sol";
import "@relicprotocol/contracts/interfaces/IReliquary.sol";

contract MyContract is BirthCertificateVerifier {

    // take Reliquary address as constructor arg, could instead be hardcoded
    constructor(IReliquary reliquary) BirthCertificateVerifier(reliquary) { }

    function someFunction() external onlyOlderThan(365 days) {
        // we know msg.sender's account is at least 1 year old
    }
}
```
