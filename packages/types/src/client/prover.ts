import type { ethers } from 'ethers'

export interface Prover {
  prove: (params: any) => Promise<ethers.PopulatedTransaction>
  fee: () => Promise<ethers.BigNumber>
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
