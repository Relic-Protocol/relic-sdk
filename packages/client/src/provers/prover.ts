import { ethers } from 'ethers'
import { abi as proverAbi } from '@relicprotocol/contracts/abi/IProver.json'
import { abi as ephemeralFactsAbi } from '@relicprotocol/contracts/abi/IEphemeralFacts.json'

import { Prover, EphemeralProver } from '@relicprotocol/types'

export interface ReceiverContext {
  initiator: string
  receiver: string
  extra: string
  gasLimit: ethers.BigNumberish
}

export class ProverImpl<Params> implements Prover {
  protected prover: ethers.Contract

  constructor(provider: ethers.providers.Provider, proverAddress: string) {
    this.prover = new ethers.Contract(proverAddress, proverAbi, provider)
  }

  protected async getProof(params: Params): Promise<string> {
    throw 'getProof() unimplemented'
  }

  async prove(params: Params): Promise<ethers.PopulatedTransaction> {
    return await this.prover.populateTransaction.prove(
      this.getProof(params),
      true
    )
  }
}

export class EphemeralProverImpl<Params>
  extends ProverImpl<Params>
  implements EphemeralProver
{
  private ephemeralFacts: ethers.Contract

  constructor(
    provider: ethers.providers.Provider,
    proverAddress: string,
    ephemeralFactsAddress: string
  ) {
    super(provider, proverAddress)
    this.ephemeralFacts = new ethers.Contract(
      ephemeralFactsAddress,
      ephemeralFactsAbi,
      provider
    )
  }

  async proveEphemeral(
    context: ReceiverContext,
    params: Params
  ): Promise<ethers.PopulatedTransaction> {
    return await this.ephemeralFacts.populateTransaction.proveEphemeral(
      context,
      this.prover.address,
      this.getProof(params)
    )
  }
}
