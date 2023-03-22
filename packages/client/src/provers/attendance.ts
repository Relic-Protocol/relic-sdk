import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IAttendanceProver.json'
import { Prover } from '@relicprotocol/types'

import { RelicClient } from '../client'

export interface AttendanceParams {
  account: string
  eventId: ethers.BigNumberish
  code: string
}

export class AttendanceProver implements Prover {
  readonly client: RelicClient
  readonly contract: ethers.Contract

  constructor(client: RelicClient) {
    this.client = client
    this.contract = new ethers.Contract(
      client.addresses.attendanceProver,
      abi,
      client.provider
    )
  }

  async prove(params: AttendanceParams): Promise<ethers.PopulatedTransaction> {
    const proof = await this.client.api.attendanceProof(
      params.account,
      params.eventId,
      params.code
    )
    return await this.contract.populateTransaction.claim(
      proof.account,
      proof.eventId,
      proof.number,
      proof.signatureInner,
      proof.signatureOuter
    )
  }

  fee(): Promise<ethers.BigNumber> {
    return this.client.reliquary.getFee(this.contract.address)
  }
}
