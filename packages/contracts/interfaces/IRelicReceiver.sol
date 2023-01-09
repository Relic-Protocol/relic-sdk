/// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import "../lib/Facts.sol";

/**
 * @title IRelicReceiver
 * @author Theori, Inc.
 * @notice IRelicReceiver has callbacks to receive ephemeral facts from Relic
 *         The Relic SDK provides a RelicReceiver base class which implements
 *         IRelicReceiver and simplifies ephemeral fact handling.
 */
interface IRelicReceiver {
    /**
     * @notice receives an ephemeral fact from Relic
     * @param initiator the account which initiated the fact proving
     * @param fact the proven fact information
     * @param data extra data passed from the initiator - this data may come
     *        from untrusted parties and thus should be validated
     */
    function receiveFact(address initiator, Fact calldata fact, bytes calldata data) external;
}
