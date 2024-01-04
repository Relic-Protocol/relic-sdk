import { ethers, utils as ethersUtils } from 'ethers'

import { RelicClient } from '../client'
import { EphemeralProverImpl, ProofData } from './prover'

import { utils } from '../'

type Params = ethers.providers.Log

export class LogProver extends EphemeralProverImpl<Params> {
  constructor(client: RelicClient) {
    super(client, 'logProver')
  }

  override async getProofData(log: Params): Promise<ProofData> {
    // get the index of the log inside the transaction
    const receipt = await this.client.dataProvider.getTransactionReceipt(
      log.transactionHash
    )
    const logIdx = log.logIndex - receipt.logs[0].logIndex

    const proof = await this.api.logProof(
      log.blockHash,
      log.transactionIndex,
      logIdx
    )

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['uint256', 'uint256', 'bytes', 'bytes', 'bytes'],
      [
        proof.txIdx,
        proof.logIdx,
        proof.receiptProof,
        proof.header,
        proof.blockProof,
      ]
    )

    return {
      proof: proofData,
      sigData: utils.logSigData(proof.blockNum, proof.txIdx, proof.logIdx),
    }
  }
}
