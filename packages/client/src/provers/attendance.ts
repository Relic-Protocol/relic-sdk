import type { RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IAttendanceProver.json'
import { Prover } from '@relicprotocol/types'

import { RelicAPI } from '../api'

export interface AttendanceParams {
  account: string
  eventId: ethers.BigNumberish
  code: string
}

export class AttendanceProver implements Prover {
  private api: RelicAPI
  private contract: ethers.Contract

  constructor(
    api: RelicAPI,
    provider: ethers.providers.Provider,
    addresses: RelicAddresses
  ) {
    this.api = api
    this.contract = new ethers.Contract(
      addresses.attendanceProver,
      abi,
      provider
    )
  }

  async prove(params: AttendanceParams): Promise<ethers.PopulatedTransaction> {
    const proof = await this.api.attendanceProof(
      params.account,
      params.eventId,
      params.code
    )
    return await this.contract.populateTransction.claim(
      proof.account,
      proof.eventId,
      proof.number,
      proof.signatureInner,
      proof.signatureOuter
    )
  }
}
