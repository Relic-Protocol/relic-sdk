import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { RelicClient } from '../client'
import { EphemeralProverImpl, ProofData } from './prover'

import { utils } from '../'

export interface BlockHeaderParams {
  block: ethers.providers.BlockTag
}

export class BlockHeaderProver extends EphemeralProverImpl<BlockHeaderParams> {
  constructor(client: RelicClient) {
    super(client, 'blockHeaderProver')
  }

  override async getProofData(params: BlockHeaderParams): Promise<ProofData> {
    const proof = await this.client.api.blockProof(params.block)

    const proofData = defaultAbiCoder.encode(
      ['bytes', 'bytes'],
      [proof.header, proof.blockProof]
    )
    return {
      proof: proofData,
      sigData: utils.blockHeaderSigData(proof.blockNum),
    }
  }
}
