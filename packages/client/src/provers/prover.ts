import { ethers } from 'ethers'
import { abi as proverAbi } from '@relicprotocol/contracts/abi/IProver.json'
import { abi as batchProverAbi } from '@relicprotocol/contracts/abi/IBatchProver.json'
import { abi as ephemeralFactsAbi } from '@relicprotocol/contracts/abi/IEphemeralFacts.json'

import type { RelicClient } from '../client'
import { Prover, EphemeralProver, RelicAddresses } from '@relicprotocol/types'

export interface ReceiverContext {
  initiator: string
  receiver: string
  extra?: string
  gasLimit: ethers.BigNumberish
}

export type ProofData = {
  proof: string
  sigData: string
}

export type BatchProofData = {
  proof: string
  sigDatas: Array<string>
}

export abstract class ProverImpl<Params> implements Prover {
  readonly client: RelicClient
  readonly contract: ethers.Contract

  constructor(client: RelicClient, key: keyof RelicAddresses) {
    this.client = client
    this.contract = new ethers.Contract(
      client.addresses[key],
      proverAbi,
      client.provider
    )
  }

  abstract getProofData(params: Params): Promise<ProofData>

  async prove(params: Params): Promise<ethers.PopulatedTransaction> {
    const { proof } = await this.getProofData(params)
    return await this.contract.populateTransaction.prove(proof, true, {
      value: await this.fee(),
    })
  }

  fee(): Promise<ethers.BigNumber> {
    return this.client.reliquary.getFee(this.contract.address)
  }
}

export abstract class EphemeralProverImpl<Params>
  extends ProverImpl<Params>
  implements EphemeralProver
{
  readonly ephemeralFacts: ethers.Contract

  constructor(client: RelicClient, key: keyof RelicAddresses) {
    super(client, key)
    this.ephemeralFacts = new ethers.Contract(
      client.addresses.ephemeralFacts,
      ephemeralFactsAbi,
      client.provider
    )
  }

  /**
   * Proves a fact ephemerally and deliver it to the receiver
   * If context.extra is undefined, it will default to the fact signature data
   * for compatibility with the RelicReceiver SDK contracts
   */
  async proveEphemeral(
    context: ReceiverContext,
    params: Params
  ): Promise<ethers.PopulatedTransaction> {
    const { proof, sigData } = await this.getProofData(params)

    // default value for extra = fact signature data
    if (!context.extra) {
      context = { ...context, extra: sigData }
    }

    return await this.ephemeralFacts.populateTransaction.proveEphemeral(
      context,
      this.contract.address,
      proof,
      { value: await this.fee() }
    )
  }
}

export abstract class BatchProverImpl<Params> implements Prover {
  readonly client: RelicClient
  readonly contract: ethers.Contract

  constructor(client: RelicClient, key: keyof RelicAddresses) {
    this.client = client
    this.contract = new ethers.Contract(
      client.addresses[key],
      batchProverAbi,
      client.provider
    )
  }

  abstract getProofData(params: Params): Promise<BatchProofData>

  async prove(params: Params): Promise<ethers.PopulatedTransaction> {
    const { proof } = await this.getProofData(params)
    return await this.contract.populateTransaction.proveBatch(proof, true, {
      value: await this.fee(),
    })
  }

  fee(): Promise<ethers.BigNumber> {
    return this.client.reliquary.getFee(this.contract.address)
  }
}
