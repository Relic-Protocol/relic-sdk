import { ethers, utils as ethersUtils } from 'ethers'

import { EphemeralProverImpl, ProofData } from './prover'
import { RelicClient } from '../client'
import { TransactionHashMismatch } from '../errors'
import { utils } from '..'

type Params = ethers.providers.TransactionReceipt

export class TransactionProver extends EphemeralProverImpl<Params> {
  constructor(client: RelicClient) {
    super(client, 'transactionProver')
  }

  override async getProofData(params: Params): Promise<ProofData> {
    const proof = await this.api.transactionProof(
      params.blockHash,
      params.transactionIndex
    )

    if (params.transactionHash != proof.txHash) {
      throw new TransactionHashMismatch(params.transactionHash, proof.txHash)
    }

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['uint256', 'bytes', 'bytes', 'bytes'],
      [proof.txIdx, proof.txProof, proof.header, proof.blockProof]
    )

    return {
      proof: proofData,
      sigData: utils.transactionSigData(proof.txHash),
    }
  }
}
