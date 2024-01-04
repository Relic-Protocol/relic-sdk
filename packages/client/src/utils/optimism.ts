import { ethers } from 'ethers'
import {
  makeStateTrieProof,
  DEFAULT_L2_CONTRACT_ADDRESSES,
} from '@eth-optimism/sdk'

interface OutputRootProof {
  version: string
  stateRoot: string
  messagePasserStorageRoot: string
  latestBlockhash: string
}

export async function getOutputRootProof(
  provider: ethers.providers.Provider,
  l2BlockNumber: number
): Promise<OutputRootProof> {
  const blockTag =
    '0x' + ethers.BigNumber.from(l2BlockNumber).toNumber().toString(16)
  // cast the provider to access the `send` method
  // note: it doesn't need to be a JsonRpcProvider, as long as it supports the `send` method
  const casted = provider as ethers.providers.JsonRpcProvider
  const block = await casted.send('eth_getBlockByNumber', [blockTag, false])

  const rootProof = await makeStateTrieProof(
    provider as ethers.providers.JsonRpcProvider,
    l2BlockNumber,
    DEFAULT_L2_CONTRACT_ADDRESSES.L2ToL1MessagePasser as string,
    ethers.constants.HashZero
  )

  return {
    version: ethers.constants.HashZero,
    stateRoot: block.stateRoot,
    messagePasserStorageRoot: rootProof.storageRoot,
    latestBlockhash: block.hash,
  }
}

export function hashOutputRootProof(proof: OutputRootProof) {
  return ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'bytes32', 'bytes32', 'bytes32'],
      [
        proof.version,
        proof.stateRoot,
        proof.messagePasserStorageRoot,
        proof.latestBlockhash,
      ]
    )
  )
}
