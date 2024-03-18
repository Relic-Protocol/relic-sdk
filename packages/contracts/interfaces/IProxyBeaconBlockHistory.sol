/// SPDX-License-Identifier: UNLICENSED
/// (c) Theori, Inc. 2022
/// All rights reserved

pragma solidity >=0.8.0;

import "./IBeaconBlockHistory.sol";

/**
 * @title Proxy Beacon Block history provider
 * @author Theori, Inc.
 * @notice IProxyBeaconBlockHistory provides a way to verify beacon block roots as well as execution block hashes on L2s
 */

interface IProxyBeaconBlockHistory is IBeaconBlockHistory {
    function commitCurrentL1BlockHash() external;
}
