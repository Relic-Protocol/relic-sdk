import type { ethers } from 'ethers'
import { ZeroExString } from './utils'

export interface Prover {
  prove: (...args: any[]) => Promise<ethers.PopulatedTransaction>
}

export interface ReceiverContext {
  initiator: string
  receiver: string
  extra: string
  gasLimit: ethers.BigNumberish
}

export interface EphemeralProver extends Prover {
  proveEphemeral: (
    context: ReceiverContext,
    ...args: any[]
  ) => Promise<ethers.PopulatedTransaction>
}
