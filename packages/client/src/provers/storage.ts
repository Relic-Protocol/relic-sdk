import { ethers, utils as ethersUtils } from 'ethers'

import { EphemeralProverImpl, ProofData } from './prover'
import { RelicClient } from '../client'

import { utils } from '../'

export interface StorageSlotParams {
  block: ethers.providers.BlockTag
  account: string
  slot: ethers.BigNumberish
  expected?: ethers.BigNumberish
}

export class StorageSlotProver extends EphemeralProverImpl<StorageSlotParams> {
  constructor(client: RelicClient) {
    super(client, 'storageSlotProver')
  }

  override async getProofData(params: StorageSlotParams): Promise<ProofData> {
    const proof = await this.client.api.storageSlotProof(
      params.block,
      params.account,
      params.slot
    )

    if (typeof params.expected !== 'undefined') {
      utils.assertSlotValue(proof.slotValue, params.expected)
    }
    const proofData = ethersUtils.defaultAbiCoder.encode(
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

    return {
      proof: proofData,
      sigData: utils.storageSlotSigData(proof.slot, proof.blockNum),
    }
  }
}
