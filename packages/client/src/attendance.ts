import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IAttendanceProver.json'

import { RelicAPI } from './api'

export class AttendanceProver {
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

  async prove(
    address: string,
    eventId: ethers.BigNumberish,
    code: string
  ): Promise<ethers.UnsignedTransaction> {
    const proof = await this.api.attendanceProof(address, eventId, code)
    return await this.contract.populateTransction.claim(
      proof.account,
      proof.eventId,
      proof.number,
      proof.signatureInner,
      proof.signatureOuter
    )
  }
}
