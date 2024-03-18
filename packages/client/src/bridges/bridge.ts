import { ethers } from 'ethers'
import { abi as messengerAbi } from '@relicprotocol/contracts/abi/IBlockHashMessenger.json'
import { RelicClient } from '../client'
import { BridgeNotNecessary } from '../errors'

export interface MessengerParams {
  value: ethers.BigNumberish
  params: string
}

export abstract class Bridge {
  readonly client: RelicClient
  readonly messenger: ethers.Contract

  constructor(client: RelicClient) {
    this.client = client
    this.messenger = new ethers.Contract(
      client.addresses.messenger,
      messengerAbi,
      client.dataProvider
    )
  }

  abstract getParams(
    blockNum: ethers.BigNumberish,
    blockHash: string
  ): Promise<MessengerParams>

  async waitUntilBridged(block: ethers.providers.BlockTag): Promise<void> {
    await this.client.blockHistory.waitUntilVerifiable(block)
  }

  async sendBlock(
    block: ethers.providers.BlockTag,
    force?: boolean
  ): Promise<ethers.PopulatedTransaction> {
    const header = await this.client.dataProvider.getBlock(block)
    if (!force) {
      const notNecessary = await this.client.blockHistory.canVerifyBlock(
        header.number
      )
      if (notNecessary) {
        throw new BridgeNotNecessary(block)
      }
    }
    const proof = await this.client.api.blockProof(block)
    const { value, params } = await this.getParams(header.number, header.hash)
    return this.messenger.populateTransaction.sendBlockHash(
      this.client.addresses.blockHistory,
      params,
      header.number,
      header.hash,
      proof.blockProof,
      { value }
    )
  }
}
