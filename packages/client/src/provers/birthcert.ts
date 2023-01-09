import { RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { RelicAPI } from '../api'
import { EphemeralProverImpl } from './prover'

export interface BirthCertificateParams {
  account: string
}

export class BirthCertificateProver extends EphemeralProverImpl<BirthCertificateParams> {
  private api: RelicAPI

  constructor(
    api: RelicAPI,
    provider: ethers.providers.Provider,
    addresses: RelicAddresses
  ) {
    super(provider, addresses.birthCertificateProver, addresses.ephemeralFacts)
    this.api = api
  }

  protected async getProof(params: BirthCertificateParams): Promise<string> {
    const proof = await this.api.birthCertificateProof(params.account)

    return defaultAbiCoder.encode(
      ['address', 'bytes', 'bytes', 'bytes'],
      [proof.account, proof.accountProof, proof.header, proof.blockProof]
    )
  }
}
