import type { RelicConfig } from '@relicprotocol/types'
import { ethers } from 'ethers'
import { BlockProof } from '@relicprotocol/types'
import { abi as mainAbi } from '@relicprotocol/contracts/abi/IBlockHistory.json'
import { abi as proxyAbi } from '@relicprotocol/contracts/abi/IProxyBlockHistory.json'
import { abi as opNativeAbi } from '@relicprotocol/contracts/abi/IOptimismNativeBlockHistory.json'
import { RelicClient } from './client'
import {
  blockNumberToChunk,
  getLogs,
  getOutputRootProof,
  hashOutputRootProof,
  isL2ChainId,
  isProxyL2Deployment,
  toBytes32,
} from './utils'
import { BlockNotVerifiable, NotL1Network, NotNativeL2 } from './errors'

const TRUSTED_HASH_PROOF = '0x01'

function getAbi(chainId: number, dataChainId: number): any {
  if (isProxyL2Deployment(chainId, dataChainId)) {
    return proxyAbi
  } else if (isL2ChainId(chainId)) {
    return opNativeAbi
  } else {
    return mainAbi
  }
}

const NEGATIVE_ONE = ethers.BigNumber.from(-1)

function max(vals: Array<ethers.BigNumber>) {
  return vals.reduce((l, r) => (l.gt(r) ? l : r))
}

export class BlockHistory {
  private client: RelicClient
  private contract: ethers.Contract
  private merkleRootCache: Record<number, string>
  private trustedCache: Record<number, string>

  constructor(client: RelicClient) {
    this.client = client
    const abi = getAbi(client.chainId, client.dataChainId)
    this.contract = new ethers.Contract(
      client.addresses.blockHistory,
      abi,
      client.provider
    )
    this.merkleRootCache = {}
    this.trustedCache = {}
  }

  async merkleRootForBlock(blockNum: number): Promise<string | null> {
    const chunk = blockNumberToChunk(blockNum)
    let root = this.merkleRootCache[chunk]
    if (root) {
      return root
    }
    const filter = this.contract.filters.ImportMerkleRoot(chunk)
    const logs = await this.contract.provider.getLogs({
      ...filter,
      fromBlock: blockNum,
    })
    if (logs.length == 0) {
      return null
    }
    root = logs.pop()!.data.substring(0, 66)
    this.merkleRootCache[chunk] = root
    return root
  }

  async isTrustedHash(blockNum: number, blockHash: string): Promise<boolean> {
    if (!this.contract.filters.TrustedBlockHash) {
      return false
    }
    if (this.trustedCache[blockNum] == toBytes32(blockHash)) {
      return true
    }
    const trusted = await this.contract.validBlockHash(
      blockHash,
      blockNum,
      TRUSTED_HASH_PROOF,
      { from: this.client.addresses.reliquary }
    )
    if (trusted) {
      this.trustedCache[blockNum] = toBytes32(blockHash)
    }
    return trusted
  }

  async canVerifyBlock(block: ethers.providers.BlockTag): Promise<boolean> {
    const header = await this.client.dataProvider.getBlock(block)
    const [root, trusted] = await Promise.all([
      this.merkleRootForBlock(header.number),
      this.isTrustedHash(header.number, header.hash),
    ])
    return root != null || trusted
  }

  async validBlockHash(
    hash: string,
    number: ethers.BigNumberish,
    proof: string
  ): Promise<boolean> {
    return this.contract.validBlockHash(hash, number, proof)
  }

  async ensureValidProof(proof: BlockProof): Promise<void> {
    let number = proof.blockNum
    let hash = ethers.utils.keccak256(proof.header)

    // if the merkle root is imported, leave the proof as-is
    if ((await this.merkleRootForBlock(number)) != null) {
      return
    }

    // if the block is a known trusted hash, replace the proof
    if (await this.isTrustedHash(number, hash)) {
      proof.blockProof = TRUSTED_HASH_PROOF
      return
    }

    // otherwise, the proof is not verifiable
    throw new BlockNotVerifiable(number, this.client.chainId)
  }

  async getLastMerkleRootBlock() {
    if (!this.contract.filters.ImportMerkleRoot) {
      return NEGATIVE_ONE
    }
    const logs = await getLogs(
      this.contract.provider,
      this.contract.filters.ImportMerkleRoot()
    )
    if (logs.length == 0) {
      return NEGATIVE_ONE
    }
    const vals = logs.map((l) => {
      const rootIdx = ethers.BigNumber.from(logs[logs.length - 1].topics[1])
      return rootIdx.add(1).mul(8192).sub(1)
    })
    return max(vals)
  }

  async getLastTrustedBlock() {
    if (!this.contract.filters.TrustedBlockHash) {
      return NEGATIVE_ONE
    }
    const logs = await getLogs(
      this.contract.provider,
      this.contract.filters.TrustedBlockHash()
    )
    if (logs.length == 0) {
      return NEGATIVE_ONE
    }
    const vals = logs.map((l) => {
      const [blockNum] = ethers.utils.defaultAbiCoder.decode(
        ['uint256', 'bytes32'],
        logs[logs.length - 1].data
      )
      return blockNum
    })
    return max(vals)
  }

  async getLastPrecomiitedBlock() {
    if (!this.contract.filters.PrecomittedBlock) {
      return NEGATIVE_ONE
    }
    const logs = await getLogs(
      this.contract.provider,
      this.contract.filters.PrecomittedBlock()
    )
    if (logs.length == 0) {
      return NEGATIVE_ONE
    }
    const vals = logs.map((l) => {
      return ethers.BigNumber.from(logs[logs.length - 1].topics[1])
    })
    return max(vals)
  }

  async getLastVerifiableBlock() {
    const vals = await Promise.all([
      this.getLastMerkleRootBlock(),
      this.getLastTrustedBlock(),
      this.getLastPrecomiitedBlock(),
    ])
    // return the max
    return max(vals)
  }

  async commitRecent(
    blockNum: ethers.BigNumberish
  ): Promise<ethers.PopulatedTransaction> {
    if (
      this.client.chainId != this.client.dataChainId ||
      !isL2ChainId(this.client.chainId)
    ) {
      throw new NotNativeL2(this.client.chainId, this.client.dataChainId)
    }
    return this.contract.populateTransaction.commitRecent(blockNum)
  }

  async importBlockhashFromOutputRoot(
    l2BlockNumber: ethers.BigNumberish,
    l1Provider: ethers.providers.Provider,
    proxyConfigOverride?: Partial<RelicConfig>
  ): Promise<ethers.PopulatedTransaction> {
    if (
      this.client.chainId != this.client.dataChainId ||
      !isL2ChainId(this.client.chainId)
    ) {
      throw new NotNativeL2(this.client.chainId, this.client.dataChainId)
    }

    l2BlockNumber = ethers.BigNumber.from(l2BlockNumber)
    const proxyClient = await RelicClient.fromProviders(
      this.client.provider,
      l1Provider,
      proxyConfigOverride
    )
    if (isL2ChainId(proxyClient.dataChainId)) {
      throw new NotL1Network(proxyClient.dataChainId)
    }
    const l2OutputOracle = new ethers.Contract(
      await this.contract.l2OutputOracle(),
      [
        'function SUBMISSION_INTERVAL() external view returns (uint256)',
        'function FINALIZATION_PERIOD_SECONDS() external view returns (uint256)',
        'function startingBlockNumber() external view returns (uint256)',
        'function getL2Output(uint256) external view returns (bytes32,uint128,uint128)',
      ],
      l1Provider
    )
    const [interval, startingBlockNumber, base, block] = await Promise.all([
      l2OutputOracle.SUBMISSION_INTERVAL(),
      l2OutputOracle.startingBlockNumber(),
      this.contract.OUTPUT_ROOTS_BASE_SLOT(),
      proxyClient.blockHistory.getLastVerifiableBlock(),
    ])
    if (l2BlockNumber.lt(startingBlockNumber.add(interval))) {
      throw new Error(
        `the given l2 block number is below first stored output root`
      )
    }
    if (!l2BlockNumber.sub(startingBlockNumber).mod(interval).eq(0)) {
      throw new Error(
        `l2 block number must be a multiple of SUBMISSION_INTERVAL (${interval})`
      )
    }
    const index = l2BlockNumber.sub(startingBlockNumber).div(interval).sub(1)

    const [[, submissionTimestamp], l1BlockTimestamp, finalization] =
      await Promise.all([
        l2OutputOracle.getL2Output(index),
        l1Provider.getBlock(block.toNumber()).then((b) => b.timestamp),
        l2OutputOracle.FINALIZATION_PERIOD_SECONDS(),
      ])
    if (submissionTimestamp.add(finalization).gt(l1BlockTimestamp)) {
      throw new Error(
        `checkpoint block is not finalized in most recent verifiable L1 block`
      )
    }

    const account = l2OutputOracle.address
    const l2OutputRootProof = await getOutputRootProof(
      this.client.provider,
      l2BlockNumber.toNumber()
    )
    const slot = ethers.BigNumber.from(ethers.utils.keccak256(base)).add(
      index.mul(2)
    )
    const slots = [slot, slot.add(1)]
    const expected = [hashOutputRootProof(l2OutputRootProof), undefined]
    const { proof } = await proxyClient.multiStorageSlotProver.getProofData({
      account,
      slots,
      block: block.toNumber(),
      expected,
      includeHeader: true,
    })

    return this.contract.populateTransaction.importCheckpointBlockFromL1(
      proof,
      index,
      block,
      l2OutputRootProof
    )
  }
}
