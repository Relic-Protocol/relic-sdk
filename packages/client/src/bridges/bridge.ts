import { ethers } from 'ethers'
import { abi as messengerAbi } from '@relicprotocol/contracts/abi/IBlockHashMessenger.json'
import { abi as proxyAbi } from '@relicprotocol/contracts/abi/IProxyBlockHistory.json'
import { RelicClient } from '../client'
import { BridgeNotNecessary } from '../errors'
import { blockForTimestamp } from '../utils'

export interface MessengerParams {
  value: ethers.BigNumberish
  params: string
}

export abstract class Bridge {
  readonly client: RelicClient
  readonly messenger: ethers.Contract
  readonly proxyBlockHistory: ethers.Contract

  constructor(client: RelicClient) {
    this.client = client
    this.messenger = new ethers.Contract(
      client.addresses.messenger,
      messengerAbi,
      client.dataProvider
    )

    this.proxyBlockHistory = new ethers.Contract(
      client.addresses.blockHistory,
      proxyAbi,
      client.provider
    )
  }

  abstract getParams(
    blockNum: ethers.BigNumberish,
    blockHash: string
  ): Promise<MessengerParams>

  async waitUntilBridged(block: ethers.providers.BlockTag): Promise<void> {
    const header = await this.client.dataProvider.getBlock(block)
    const filter = this.proxyBlockHistory.filters.TrustedBlockHash()
    const fromBlock = await blockForTimestamp(
      this.client.provider,
      header.timestamp
    ).then((b) => b.number)
    const isTargetEvent = (log: ethers.providers.Log, ..._: Array<any>) => {
      const { args } = this.proxyBlockHistory.interface.parseLog(log)
      return args.blockHash == header.hash
    }
    return new Promise(async (res) => {
      const listener = (event: ethers.Event) => {
        if (isTargetEvent(event)) {
          this.proxyBlockHistory.off(filter, listener)
          res()
        }
      }
      this.proxyBlockHistory.on(filter, listener)

      // query logs after setting up listener to avoid races
      const logs = await this.client.provider.getLogs({ ...filter, fromBlock })
      if (logs.some(isTargetEvent)) {
        this.proxyBlockHistory.off(filter, listener)
        res()
      }
    })
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
