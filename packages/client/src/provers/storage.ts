import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { RelicAddresses } from '@relicprotocol/types'
import { RelicAPI } from '../api'
import { EphemeralProverImpl } from './prover'

export interface StorageSlotParams {
  block: number
  account: string
  slot: ethers.BigNumberish
  expected?: ethers.BigNumberish
}

export class StorageSlotProver extends EphemeralProverImpl<StorageSlotParams> {
  private api: RelicAPI

  constructor(
    api: RelicAPI,
    provider: ethers.providers.Provider,
    addresses: RelicAddresses
  ) {
    super(provider, addresses.storageSlotProver, addresses.ephemeralFacts)
    this.api = api
  }

  protected async getProof(params: StorageSlotParams): Promise<string> {
    const proof = await this.api.storageSlotProof(
      params.block,
      params.account,
      params.slot
    )

    if (typeof params.expected !== 'undefined') {
      const v0 = ethers.BigNumber.from(proof.slotValue)
      const v1 = ethers.BigNumber.from(params.expected)
      if (!v0.eq(v1)) {
        throw `slot value didn't match expected: ${proof.slotValue} vs ${params.expected}`
      }
    }
    return defaultAbiCoder.encode(
      ['address', 'bytes', 'bytes32', 'bytes', 'bytes', 'bytes'],
      [
        proof.account,
        proof.accountProof,
        proof.slot,
        proof.slotProof,
        proof.header,
        proof.blockProof,
      ]
    )
  }
}
