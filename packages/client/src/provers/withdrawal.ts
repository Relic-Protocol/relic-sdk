import { ethers, utils as ethersUtils } from 'ethers'

import { RelicClient } from '../client'
import { EphemeralProverImpl, ProofData } from './prover'

import { utils } from '../'

export interface WithdrawalParams {
  block: ethers.providers.BlockTag
  idx: number
}

export class WithdrawalProver extends EphemeralProverImpl<WithdrawalParams> {
  constructor(client: RelicClient) {
    super(client, 'withdrawalProver')
  }

  override async getProofData(params: WithdrawalParams): Promise<ProofData> {
    const proof = await this.client.api.withdrawalProof(
      params.block,
      params.idx
    )

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['uint256', 'bytes', 'bytes', 'bytes'],
      [params.idx, proof.withdrawalProof, proof.header, proof.blockProof]
    )

    return {
      proof: proofData,
      sigData: utils.withdrawalSigData(proof.blockNum, params.idx),
    }
  }
}
