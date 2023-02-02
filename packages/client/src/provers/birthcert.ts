import { utils as ethersUtils } from 'ethers'

import { RelicClient } from '../client'
import { EphemeralProverImpl, ProofData } from './prover'

import { utils } from '../'

export interface BirthCertificateParams {
  account: string
}

export class BirthCertificateProver extends EphemeralProverImpl<BirthCertificateParams> {
  constructor(client: RelicClient) {
    super(client, 'birthCertificateProver')
  }

  override async getProofData(
    params: BirthCertificateParams
  ): Promise<ProofData> {
    const proof = await this.client.api.birthCertificateProof(params.account)

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['address', 'bytes', 'bytes', 'bytes'],
      [proof.account, proof.accountProof, proof.header, proof.blockProof]
    )
    return {
      proof: proofData,
      sigData: utils.birthCertificateSigData(),
    }
  }
}
