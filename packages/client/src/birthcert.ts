import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IBirthCertificateProver.json'

import { RelicAPI } from './api'

export class BirthCertificateProver {
  api: RelicAPI
  contract: ethers.Contract

  constructor(
    api: RelicAPI,
    provider: ethers.providers.Provider,
    address: string
  ) {
    this.api = api
    this.contract = new ethers.Contract(address, abi, provider)
  }

  async prove(address: string): Promise<ethers.UnsignedTransaction> {
    const proof = await this.api.birthCertificateProof(address)

    return await this.contract.populateTransaction.proveBirthCertificate(
      proof.account,
      proof.accountProof,
      proof.header,
      proof.blockProof
    )
  }
}
