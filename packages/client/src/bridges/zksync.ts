import { ethers } from 'ethers'
import { MessengerParams, Bridge } from './bridge'
import { RelicClient } from '../client'
import { getConnectionInfo } from '../utils'

import { Provider, Wallet, utils as zksyncUtils } from 'zksync-web3'

export class ZkSyncBridge extends Bridge {
  private zkWallet: Wallet

  constructor(client: RelicClient) {
    super(client)
    const provider = new Provider(getConnectionInfo(client.provider))
    // Wallet is needed for some methods, but we don't care about the priv key
    this.zkWallet = Wallet.createRandom()
      .connect(provider)
      .connectToL1(this.client.dataProvider)
  }

  override async getParams(
    blockNum: ethers.BigNumberish,
    blockHash: string
  ): Promise<MessengerParams> {
    const contract = this.client.blockHistory.getContract()
    const call = await contract.populateTransaction.importTrustedHash(
      blockNum,
      blockHash
    )
    const request = {
      contractAddress: call.to!,
      calldata: call.data!,
      caller: zksyncUtils.applyL1ToL2Alias(this.messenger.address),
    }
    const l2GasLimit = await this.zkWallet.provider.estimateL1ToL2Execute(
      request
    )

    const l2Tx = await this.zkWallet.getRequestExecuteTx(request)
    const value = l2Tx.value!

    const l2GasPerPubdataByteLimit =
      zksyncUtils.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT
    const params = ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256'],
      [l2GasLimit, l2GasPerPubdataByteLimit]
    )

    return { value, params }
  }
}
