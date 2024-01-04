import { ethers } from 'ethers'
import { abi as proverAbi } from '@relicprotocol/contracts/abi/IProver.json'
import { abi as batchProverAbi } from '@relicprotocol/contracts/abi/IBatchProver.json'
import { abi as ephemeralFactsAbi } from '@relicprotocol/contracts/abi/IEphemeralFacts.json'
import {
  BlockProof,
  Prover,
  EphemeralProver,
  RelicAddresses,
} from '@relicprotocol/types'

import type { RelicClient } from '../client'
import { RelicAPI } from '../api'
import { isL2ChainId, isProxyL2Deployment } from '../utils'

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

// wrap a RelicAPI with one that ensures blockProofs can be
// validated on the target chain
function wrapAPI(client: RelicClient): RelicAPI {
  if (!isProxyL2Deployment(client.chainId, client.dataChainId)) {
    return client.api
  }

  function isBlockProof(obj: any): obj is BlockProof {
    return (obj.blockNum && obj.header && obj.blockProof) !== undefined
  }

  return new Proxy(client.api, {
    get(target: RelicAPI, p: keyof RelicAPI) {
      if (p.startsWith('_')) return target[p]
      if (target[p] instanceof Function) {
        return async (...args: any[]) => {
          let result = await (target[p] as Function).call(target, ...args)
          if (isBlockProof(result)) {
            await client.blockHistory.ensureValidProof(result)
          }
          return result
        }
      }
    },
  })
}

export abstract class ProverImpl<Params> implements Prover {
  readonly client: RelicClient
  readonly contract: ethers.Contract
  readonly api: RelicAPI

  constructor(client: RelicClient, key: keyof RelicAddresses) {
    this.client = client
    this.contract = new ethers.Contract(
      client.addresses[key],
      proverAbi,
      client.provider
    )
    this.api = wrapAPI(client)
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
  readonly api: RelicAPI

  constructor(client: RelicClient, key: keyof RelicAddresses) {
    this.client = client
    this.contract = new ethers.Contract(
      client.addresses[key],
      batchProverAbi,
      client.provider
    )
    this.api = wrapAPI(client)
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
