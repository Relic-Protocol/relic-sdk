import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { EphemeralProverImpl, ProofData } from './prover'
import { RelicClient } from '../client'
import { StorageSlotParams } from './storage'

import { utils } from '../'

export class CachedStorageSlotProver extends EphemeralProverImpl<StorageSlotParams> {
  constructor(client: RelicClient) {
    super(client, 'cachedStorageSlotProver')
  }

  override async getProofData(params: StorageSlotParams): Promise<ProofData> {
    const ssProof = await this.client.api.storageSlotProof(
      params.block,
      params.account,
      params.slot
    )

    const accProof = await this.client.api.accountProof(
      params.block,
      params.account
    )

    if (typeof params.expected !== 'undefined') {
      utils.assertSlotValue(ssProof.slotValue, params.expected)
    }

    const proofData = defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes32', 'bytes32', 'bytes'],
      [
        ssProof.account,
        accProof.blockNum,
        accProof.storageHash,
        ssProof.slot,
        ssProof.slotProof,
      ]
    )

    return {
      proof: proofData,
      sigData: utils.storageSlotSigData(ssProof.slot, accProof.blockNum),
    }
  }
}
