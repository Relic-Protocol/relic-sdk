import type { RelicConfig, RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'

import { RelicAPI } from './api'
import { InvalidDataProvider, UnsupportedNetwork } from './errors'
import {
  AccountStorageProver,
  AttendanceProver,
  BlockHeaderProver,
  BirthCertificateProver,
  StorageSlotProver,
  CachedStorageSlotProver,
  MultiStorageSlotProver,
  CachedMultiStorageSlotProver,
  WithdrawalProver,
} from './provers'
import { Reliquary } from './reliquary'

import { LogProver } from './provers/log'

type ApiConfig = {
  url: string
  dataChainId: number
}

const defaultAPI: Record<number, ApiConfig> = {
  // mainnet
  1: {
    url: 'https://api.mainnet.relicprotocol.com/v1',
    dataChainId: 1,
  },
  // sepolia
  11155111: {
    url: 'https://api.sepolia.relicprotocol.com/v1',
    dataChainId: 11155111,
  },
  // zkSync era testnet
  280: {
    url: 'https://api.mainnet.relicprotocol.com/v1',
    dataChainId: 1,
  },
  // zkSync era mainnet
  324: {
    url: 'https://api.mainnet.relicprotocol.com/v1',
    dataChainId: 1,
  },
}

export class RelicClient {
  readonly provider: ethers.providers.Provider
  readonly dataProvider: ethers.providers.Provider
  readonly api: RelicAPI
  readonly addresses: RelicAddresses

  readonly reliquary: Reliquary
  readonly attendanceProver: AttendanceProver
  readonly birthCertificateProver: BirthCertificateProver
  readonly storageSlotProver: StorageSlotProver
  readonly logProver: LogProver
  readonly blockHeaderProver: BlockHeaderProver
  readonly accountStorageProver: AccountStorageProver
  readonly cachedStorageSlotProver: CachedStorageSlotProver
  readonly multiStorageSlotProver: MultiStorageSlotProver
  readonly cachedMultiStorageSlotProver: CachedMultiStorageSlotProver
  readonly withdrawalProver: WithdrawalProver

  constructor(
    provider: ethers.providers.Provider,
    config: RelicConfig,
    dataProvider: ethers.providers.Provider
  ) {
    this.provider = provider
    this.dataProvider = dataProvider
    this.api = new RelicAPI(config.apiUrl)
    this.addresses = config.addresses

    this.reliquary = new Reliquary(this)
    this.attendanceProver = new AttendanceProver(this)
    this.birthCertificateProver = new BirthCertificateProver(this)
    this.storageSlotProver = new StorageSlotProver(this)
    this.logProver = new LogProver(this)
    this.blockHeaderProver = new BlockHeaderProver(this)
    this.accountStorageProver = new AccountStorageProver(this)
    this.cachedStorageSlotProver = new CachedStorageSlotProver(this)
    this.multiStorageSlotProver = new MultiStorageSlotProver(this)
    this.cachedMultiStorageSlotProver = new CachedMultiStorageSlotProver(this)
    this.withdrawalProver = new WithdrawalProver(this)
  }

  static async fromProviders(
    provider: ethers.providers.Provider,
    dataProvider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    const chainId = await provider.getNetwork().then((n) => n.chainId)
    const defaults = defaultAPI[chainId]
    if (defaults === undefined) {
      throw new UnsupportedNetwork()
    }
    const apiUrl = configOverride?.apiUrl || defaults.url

    const dataChainId = await dataProvider.getNetwork().then((n) => n.chainId)
    if (dataChainId != defaults.dataChainId) {
      throw new InvalidDataProvider(chainId, defaults.dataChainId)
    }

    const addresses =
      configOverride?.addresses ||
      (await new RelicAPI(apiUrl).addresses(chainId))

    const config: RelicConfig = { apiUrl, addresses }
    return new RelicClient(provider, config, dataProvider)
  }

  static async fromProvider(
    provider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    return this.fromProviders(provider, provider, configOverride)
  }
}
