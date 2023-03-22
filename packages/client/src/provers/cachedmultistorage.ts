import { ethers, utils as ethersUtils } from 'ethers'
import RLP from 'rlp'

import { BatchProverImpl, BatchProofData } from './prover'
import { RelicClient } from '../client'
import { MultiStorageSlotParams } from './multistorage'

import { RelicError, utils } from '..'

export class CachedMultiStorageSlotProver extends BatchProverImpl<MultiStorageSlotParams> {
  constructor(client: RelicClient) {
    super(client, 'cachedMultiStorageSlotProver')
  }

  override async getProofData(
    params: MultiStorageSlotParams
  ): Promise<BatchProofData> {
    if (params.includeHeader) {
      throw new RelicError(
        "CachedMultiStorageSlotProver doesn't support includeHeader"
      )
    }

    const [accProof, proofs] = await Promise.all([
      this.client.api.accountProof(params.block, params.account),
      Promise.all(
        params.slots.map((s) =>
          this.client.api.storageSlotProof(params.block, params.account, s)
        )
      ),
    ])

    if (params.expected !== undefined) {
      for (let i = 0; i < params.expected.length; i++) {
        let expected = params.expected[i]
        if (expected !== undefined) {
          utils.assertSlotValue(proofs[i].slotValue, expected)
        }
      }
    }

    // split each slot proof into its nodes
    const splitProofs = proofs.map((proof) => {
      let result: Array<string> = []
      let slotProof = ethersUtils.arrayify(proof.slotProof)
      while (slotProof.length > 0) {
        let { data, remainder } = RLP.decode(slotProof, true)
        result.push(ethersUtils.hexlify(RLP.encode(data)))
        slotProof = remainder
      }
      return result
    })

    // build the unique set of nodes from all the proofs
    const nodeSet = Array.from(
      new Set(new Array<string>().concat(...splitProofs))
    )

    // compress the slot proofs by referencing the unique set of nodes
    const slotProofs = ethersUtils.hexlify(
      RLP.encode(
        splitProofs.map((proof) => {
          return proof.map((node) => nodeSet.indexOf(node))
        })
      )
    )

    // concatencate the set of nodes
    const proofNodes = ethersUtils.concat(nodeSet)

    const proofData = ethersUtils.defaultAbiCoder.encode(
      ['address', 'uint256', 'uint256', 'bytes', 'uint256[]', 'bytes'],
      [
        accProof.account,
        accProof.blockNum,
        accProof.storageHash,
        proofNodes,
        params.slots,
        slotProofs,
      ]
    )

    let sigDatas = proofs.map((p) =>
      utils.storageSlotSigData(p.slot, accProof.blockNum)
    )
    return {
      proof: proofData,
      sigDatas,
    }
  }
}
