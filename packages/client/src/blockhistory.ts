import type { RelicConfig } from '@relicprotocol/types'
import { ethers } from 'ethers'
import { BlockProof } from '@relicprotocol/types'
import { abi as mainAbi } from '@relicprotocol/contracts/abi/IBlockHistory.json'
import { abi as proxyAbi } from '@relicprotocol/contracts/abi/IProxyBlockHistory.json'
import { abi as opNativeAbi } from '@relicprotocol/contracts/abi/IOptimismNativeBlockHistory.json'
import { abi as beaconAbi } from '@relicprotocol/contracts/abi/IBeaconBlockHistory.json'
import { abi as proxyBeaconAbi } from '@relicprotocol/contracts/abi/IProxyBeaconBlockHistory.json'
import { RelicClient } from './client'
import {
  blockForTimestamp,
  blockNumberToChunk,
  getLogs,
  getOutputRootProof,
  hashOutputRootProof,
  isL1ChainId,
  isL2ChainId,
  isOptimismChainId,
  isProxyL2Deployment,
  slotToTimestamp,
  timestampToSlot,
  toBytes32,
} from './utils'
import {
  BlockNotVerifiable,
  L1BlockHashNotAccessible,
  NotL1Network,
  NotNativeL2,
} from './errors'

const TRUSTED_HASH_PROOF = '0x01'
const PRECOMITTED_BLOCK_PROOF = '0x02'

const SLOTS_PER_HISTORICAL_ROOT = 8192

function getAbi(chainId: number, dataChainId: number): any {
  if (isProxyL2Deployment(chainId, dataChainId)) {
    return proxyAbi
  } else if (isL2ChainId(chainId)) {
    return opNativeAbi
  } else {
    return mainAbi
  }
}

function getBeaconAbi(chainId: number, dataChainId: number): any {
  if (isProxyL2Deployment(chainId, dataChainId)) {
    return proxyBeaconAbi
  } else {
    return beaconAbi
  }
}

const NEGATIVE_ONE = ethers.BigNumber.from(-1)

function max(vals: Array<ethers.BigNumber>) {
  return vals.reduce((l, r) => (l.gt(r) ? l : r))
}

export interface IBlockHistory {
  getContract(): ethers.Contract
  getLastVerifiableBlock(): Promise<ethers.BigNumber>
  ensureValidProof(proof: BlockProof): Promise<void>
  canVerifyBlock(block: ethers.providers.BlockTag): Promise<boolean>
  waitUntilVerifiable(block: ethers.providers.BlockTag): Promise<void>
  commitRecent(
    blockNum: ethers.BigNumberish
  ): Promise<ethers.PopulatedTransaction>
  commitCurrentL1BlockHash(): Promise<ethers.PopulatedTransaction>
}

export class BlockHistory implements IBlockHistory {
  private client: RelicClient
  private contract: ethers.Contract
  private merkleRootCache: Record<number, string>
  private trustedCache: Record<number, string>

  constructor(client: RelicClient) {
    this.client = client
    const abi = getAbi(client.chainId, client.dataChainId)
    this.contract = new ethers.Contract(
      client.addresses.legacyBlockHistory || client.addresses.blockHistory,
      abi,
      client.provider
    )
    this.merkleRootCache = {}
    this.trustedCache = {}
  }

  getContract(): ethers.Contract {
    return this.contract
  }

  async merkleRootForBlock(blockNum: number): Promise<string | null> {
    const chunk = blockNumberToChunk(blockNum)
    let root = this.merkleRootCache[chunk]
    if (root) {
      return root
    }
    const filter = this.contract.filters.ImportMerkleRoot(chunk)
    const logs = await getLogs(this.contract.provider, {
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
    const trusted = await this.contract
      .validBlockHash(blockHash, blockNum, TRUSTED_HASH_PROOF, {
        from: this.client.addresses.reliquary,
      })
      .catch(() => false)
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

  async waitUntilVerifiable(block: ethers.providers.BlockTag): Promise<void> {
    const header = await this.client.dataProvider.getBlock(block)
    const filter = this.contract.filters.TrustedBlockHash()
    const fromBlock = await blockForTimestamp(
      this.client.provider,
      header.timestamp
    ).then((b) => b.number)
    const isTargetHash = (hash: string) => {
      return hash == header.hash
    }
    return new Promise(async (res) => {
      const listener = (_: ethers.BigNumber, blockHash: string) => {
        if (isTargetHash(blockHash)) {
          this.contract.off(filter, listener)
          res()
        }
      }
      this.contract.on(filter, listener)

      // query if verifiable after setting up listeners (to avoid races)
      if (await this.canVerifyBlock(block)) {
        this.contract.off(filter, listener)
        res()
      }
    })
  }

  async commitCurrentL1BlockHash(): Promise<ethers.PopulatedTransaction> {
    if (
      !isOptimismChainId(this.client.chainId) ||
      !isL1ChainId(this.client.dataChainId)
    ) {
      throw new L1BlockHashNotAccessible(this.client.chainId)
    }
    return this.contract.populateTransaction.commitCurrentL1BlockHash()
  }
}

export class BeaconBlockHistory implements IBlockHistory {
  private client: RelicClient
  private preDencunBlockHistory: BlockHistory
  private contract: ethers.Contract
  private merkleRootCache: Record<number, string>
  private precomittedCache: Record<number, string>

  constructor(client: RelicClient) {
    this.client = client
    this.preDencunBlockHistory = new BlockHistory(client)
    this.contract = new ethers.Contract(
      client.addresses.blockHistory,
      getBeaconAbi(this.client.chainId, this.client.dataChainId),
      client.provider
    )
    this.merkleRootCache = {}
    this.precomittedCache = {}
  }

  getContract(): ethers.Contract {
    return this.contract
  }

  async summarySlotForBlock(
    block: ethers.providers.Block
  ): Promise<number | null> {
    const slot = timestampToSlot(block.timestamp, this.client.dataChainId)
    const summarySlot = slot + 8192 - (slot % SLOTS_PER_HISTORICAL_ROOT)
    const filter = this.contract.filters.ImportBlockSummary(summarySlot)
    const { number: fromBlock } = await blockForTimestamp(
      this.client.provider,
      block.timestamp
    )
    const logs = await getLogs(this.contract.provider, {
      ...filter,
      fromBlock,
    })
    if (logs.length == 0) {
      return null
    }
    return summarySlot
  }

  async isPrecomitted(blockNum: number, blockHash: string): Promise<boolean> {
    if (!this.contract.filters.PrecomittedBlock) {
      return false
    }
    if (this.precomittedCache[blockNum] == toBytes32(blockHash)) {
      return true
    }
    const precomitted = await this.contract
      .validBlockHash(blockHash, blockNum, PRECOMITTED_BLOCK_PROOF, {
        from: this.client.addresses.reliquary,
      })
      .catch(() => false)
    if (precomitted) {
      this.precomittedCache[blockNum] = toBytes32(blockHash)
    }
    return precomitted
  }

  async canVerifyBlock(block: ethers.providers.BlockTag): Promise<boolean> {
    const header = await this.client.dataProvider.getBlock(block)
    const [root, precomitted] = await Promise.all([
      this.summarySlotForBlock(header),
      this.isPrecomitted(header.number, header.hash),
    ])
    return root != null || precomitted
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

    if (number < (await this.contract.UPGRADE_BLOCK())) {
      return this.preDencunBlockHistory.ensureValidProof(proof)
    }

    // if the block is a known precommitted hash, replace the proof
    if (await this.isPrecomitted(number, hash)) {
      proof.blockProof = PRECOMITTED_BLOCK_PROOF
      return
    }

    // otherwise ensure the provided proof verifies
    const valid = await this.contract
      .validBlockHash(hash, number, proof.blockProof, {
        from: this.client.addresses.reliquary,
      })
      .catch(() => false)
    if (valid) {
      return
    }

    // otherwise, the proof is not verifiable
    throw new BlockNotVerifiable(number, this.client.chainId)
  }

  async getLastSummaryBlock() {
    if (!this.contract.filters.ImportBlockSummary) {
      return NEGATIVE_ONE
    }
    const logs = await getLogs(
      this.contract.provider,
      this.contract.filters.ImportBlockSummary()
    )
    if (logs.length == 0) {
      return NEGATIVE_ONE
    }
    const vals = logs.map((l) => {
      const slot = ethers.BigNumber.from(logs[logs.length - 1].topics[1])
      return slot.sub(1)
    })
    const maxSlot = max(vals)
    const maxTimestamp = slotToTimestamp(
      maxSlot.toNumber(),
      this.client.dataChainId
    )
    const maxBlock = await blockForTimestamp(
      this.client.dataProvider,
      maxTimestamp
    )
    return ethers.BigNumber.from(maxBlock.number)
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
      this.preDencunBlockHistory.getLastVerifiableBlock(),
      this.getLastSummaryBlock(),
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
      isL2ChainId(this.client.chainId)
    ) {
      throw new NotL1Network(this.client.dataChainId)
    }
    return this.contract.populateTransaction.commitRecent(blockNum)
  }

  async waitUntilVerifiable(block: ethers.providers.BlockTag): Promise<void> {
    const header = await this.client.dataProvider.getBlock(block)
    const filter = this.contract.filters.PrecomittedBlock(header.number)
    return new Promise(async (res) => {
      const listener = () => {
        this.contract.off(filter, listener)
        res()
      }
      this.contract.on(filter, listener)

      // query if verifiable after setting up listeners (to avoid races)
      if (await this.canVerifyBlock(block)) {
        this.contract.off(filter, listener)
        res()
      }
    })
  }

  async commitCurrentL1BlockHash(): Promise<ethers.PopulatedTransaction> {
    if (
      !isOptimismChainId(this.client.chainId) ||
      !isL1ChainId(this.client.dataChainId)
    ) {
      throw new L1BlockHashNotAccessible(this.client.chainId)
    }
    return this.contract.populateTransaction.commitCurrentL1BlockHash()
  }
}
