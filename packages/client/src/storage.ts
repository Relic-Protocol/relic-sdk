import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IStorageSlotProver.json'

import { RelicAPI } from './api'

export class StorageSlotProver {
  api: RelicAPI
  contract: ethers.Contract

  constructor(
    api: RelicAPI,
    provider: ethers.providers.Provider,
    address: string
  ) {
    this.api = api
    this.contract = new ethers.Contract(address, abi, provider)
  }

  async prove(
    block: number,
    address: string,
    slot: ethers.BigNumberish,
    expected?: ethers.BigNumberish
  ): Promise<ethers.PopulatedTransaction> {
    const proof = await this.api.storageSlotProof(block, address, slot)

    if (typeof expected !== 'undefined') {
      const v0 = ethers.BigNumber.from(proof.slotValue)
      const v1 = ethers.BigNumber.from(expected)
      if (!v0.eq(v1)) {
        throw `slot value didn't match expected: ${proof.slotValue} vs ${expected}`
      }
    }

    return await this.contract.populateTransaction.proveAndStoreStorageSlot(
      proof.account,
      proof.accountProof,
      proof.slot,
      proof.slotProof,
      proof.header,
      proof.blockProof
    )
  }
}
