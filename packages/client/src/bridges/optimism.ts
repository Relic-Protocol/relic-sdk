import { ethers } from 'ethers'
import { MessengerParams, Bridge } from './bridge'
import { RelicClient } from '../client'

import { utils as zksyncUtils } from 'zksync-web3'

export class OptimismBridge extends Bridge {
  constructor(client: RelicClient) {
    super(client)
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
    const l2GasLimit = await this.client.provider.estimateGas({
      ...call,
      from: zksyncUtils.applyL1ToL2Alias(this.messenger.address),
    })

    const params = ethers.utils.defaultAbiCoder.encode(['uint64'], [l2GasLimit])
    const value = 0

    return { value, params }
  }
}
