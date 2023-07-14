import type { RelicConfig, RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'

import { RelicAPI } from './api'
import { InvalidDataProvider, UnsupportedNetwork } from './errors'
import {
  AccountInfoProver,
  AccountStorageProver,
  AttendanceProver,
  BirthCertificateProver,
  BlockHeaderProver,
  CachedMultiStorageSlotProver,
  CachedStorageSlotProver,
  MultiStorageSlotProver,
  StorageSlotProver,
  TransactionProver,
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

  constructor(
    provider: ethers.providers.Provider,
    config: RelicConfig,
    dataProvider: ethers.providers.Provider
  ) {
    this.provider = provider
    this.dataProvider = dataProvider
    this.api = new RelicAPI(config.apiUrl)
    this.addresses = config.addresses
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

  get reliquary(): Reliquary {
    return new Reliquary(this)
  }

  get accountInfoProver(): AccountInfoProver {
      return new AccountInfoProver(this)
  }

  get accountStorageProver(): AccountStorageProver {
    return new AccountStorageProver(this)
  }

  get attendanceProver(): AttendanceProver {
    return new AttendanceProver(this)
  }

  get birthCertificateProver(): BirthCertificateProver {
    return new BirthCertificateProver(this)
  }

  get blockHeaderProver(): BlockHeaderProver {
    return new BlockHeaderProver(this)
  }

  get cachedMultiStorageSlotProver(): CachedMultiStorageSlotProver {
    return new CachedMultiStorageSlotProver(this)
  }

  get cachedStorageSlotProver(): CachedStorageSlotProver {
    return new CachedStorageSlotProver(this)
  }

  get logProver(): LogProver {
    return new LogProver(this)
  }

  get multiStorageSlotProver(): MultiStorageSlotProver {
    return new MultiStorageSlotProver(this)
  }

  get storageSlotProver(): StorageSlotProver {
    return new StorageSlotProver(this)
  }

  get transactionProver(): TransactionProver {
      return new TransactionProver(this)
  }

  get withdrawalProver(): WithdrawalProver {
    return new WithdrawalProver(this)
  }
}
