import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { RelicClient } from '../client'
import { EphemeralProverImpl, ProofData } from './prover'

import { utils } from '../'

export interface AccountStorageParams {
  block: ethers.providers.BlockTag
  account: string
}

export class AccountStorageProver extends EphemeralProverImpl<AccountStorageParams> {
  constructor(client: RelicClient) {
    super(client, 'accountStorageProver')
  }

  override async getProofData(
    params: AccountStorageParams
  ): Promise<ProofData> {
    const proof = await this.client.api.accountProof(
      params.block,
      params.account
    )

    const proofData = defaultAbiCoder.encode(
      ['address', 'bytes', 'bytes', 'bytes'],
      [proof.account, proof.accountProof, proof.header, proof.blockProof]
    )

    return {
      proof: proofData,
      sigData: utils.accountStorageSigData(proof.blockNum, proof.storageHash),
    }
  }
}
