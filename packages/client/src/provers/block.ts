import { ethers, utils as ethersUtils } from 'ethers'

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
    const proof = await this.api.blockProof(params.block)

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['bytes', 'bytes'],
      [proof.header, proof.blockProof]
    )
    return {
      proof: proofData,
      sigData: utils.blockHeaderSigData(proof.blockNum),
    }
  }
}
