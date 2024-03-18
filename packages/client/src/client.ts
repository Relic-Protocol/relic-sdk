import type { RelicConfig, RelicAddresses } from '@relicprotocol/types'
import { Memoize } from 'typescript-memoize'
import { ethers } from 'ethers'

import { RelicAPI } from './api'
import { NoBridger, InvalidDataProvider, UnsupportedNetwork } from './errors'
import {
  AccountInfoProver,
  AccountStorageProver,
  AttendanceProver,
  BirthCertificateProver,
  BlockHeaderProver,
  CachedMultiStorageSlotProver,
  CachedStorageSlotProver,
  LogProver,
  MultiStorageSlotProver,
  StorageSlotProver,
  TransactionProver,
  WithdrawalProver,
} from './provers'

import { Reliquary } from './reliquary'
import { IBlockHistory, BlockHistory, BeaconBlockHistory } from './blockhistory'
import { Bridge, OptimismBridge, ZkSyncBridge } from './bridges'
import {
  ChainId,
  isZkSyncChainId,
  isOptimismChainId,
  isL2ChainId,
} from './utils'

// chainId -> dataChainId -> apiUrl
const defaultAPI: Record<number, Record<number, string>> = {
  [ChainId.EthMainnet]: {
    [ChainId.EthMainnet]: 'https://api.mainnet.relicprotocol.com/v1',
  },
  [ChainId.EthSepolia]: {
    [ChainId.EthSepolia]: 'https://api.sepolia.relicprotocol.com/v1',
  },
  [ChainId.ZkSyncMainnet]: {
    [ChainId.EthMainnet]: 'https://api.mainnet.relicprotocol.com/v1',
  },
  [ChainId.ZkSyncSepolia]: {
    [ChainId.EthSepolia]: 'https://api.sepolia.relicprotocol.com/v1',
  },
  [ChainId.OpMainnet]: {
    [ChainId.EthMainnet]: 'https://api.mainnet.relicprotocol.com/v1',
    [ChainId.OpMainnet]: 'https://api.optimism-mainnet.relicprotocol.com/v1',
  },
  [ChainId.OpSepolia]: {
    [ChainId.EthSepolia]: 'https://api.sepolia.relicprotocol.com/v1',
    [ChainId.OpSepolia]: 'https://api.optimism-sepolia.relicprotocol.com/v1',
  },
  [ChainId.BaseMainnet]: {
    [ChainId.EthMainnet]: 'https://api.mainnet.relicprotocol.com/v1',
    [ChainId.BaseMainnet]: 'https://api.base-mainnet.relicprotocol.com/v1',
  },
  [ChainId.BaseSepolia]: {
    [ChainId.EthSepolia]: 'https://api.sepolia.relicprotocol.com/v1',
    [ChainId.BaseMainnet]: 'https://api.base-sepolia.relicprotocol.com/v1',
  },
}

export class RelicClient {
  readonly provider: ethers.providers.Provider
  readonly dataProvider: ethers.providers.Provider
  readonly api: RelicAPI
  readonly addresses: RelicAddresses
  readonly chainId: number
  readonly dataChainId: number

  constructor(
    provider: ethers.providers.Provider,
    config: RelicConfig,
    dataProvider: ethers.providers.Provider,
    chainId: number,
    dataChainId: number
  ) {
    this.provider = provider
    this.dataProvider = dataProvider
    this.addresses = config.addresses
    this.chainId = chainId
    this.dataChainId = dataChainId
    this.api = new RelicAPI(config.apiUrl)
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
    const dataChainId = await dataProvider.getNetwork().then((n) => n.chainId)
    const apiUrl = configOverride?.apiUrl || defaults[dataChainId]
    if (apiUrl === undefined) {
      throw new InvalidDataProvider(chainId, Object.keys(defaults))
    }

    const addresses =
      configOverride?.addresses ||
      (await new RelicAPI(apiUrl).addresses(chainId))

    const config: RelicConfig = { apiUrl, addresses }
    return new RelicClient(provider, config, dataProvider, chainId, dataChainId)
  }

  static async fromProvider(
    provider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    return this.fromProviders(provider, provider, configOverride)
  }

  @Memoize()
  get reliquary(): Reliquary {
    return new Reliquary(this)
  }

  @Memoize()
  get blockHistory(): IBlockHistory {
    if (this.addresses.legacyBlockHistory) {
      return new BeaconBlockHistory(this)
    } else {
      return new BlockHistory(this)
    }
  }

  @Memoize()
  get bridge(): Bridge {
    if (isZkSyncChainId(this.chainId) && !isL2ChainId(this.dataChainId)) {
      return new ZkSyncBridge(this)
    } else if (
      isOptimismChainId(this.chainId) &&
      !isL2ChainId(this.dataChainId)
    ) {
      return new OptimismBridge(this)
    }
    throw new NoBridger(this.chainId, this.dataChainId)
  }

  @Memoize()
  get accountInfoProver(): AccountInfoProver {
    return new AccountInfoProver(this)
  }

  @Memoize()
  get accountStorageProver(): AccountStorageProver {
    return new AccountStorageProver(this)
  }

  @Memoize()
  get attendanceProver(): AttendanceProver {
    return new AttendanceProver(this)
  }

  @Memoize()
  get birthCertificateProver(): BirthCertificateProver {
    return new BirthCertificateProver(this)
  }

  @Memoize()
  get blockHeaderProver(): BlockHeaderProver {
    return new BlockHeaderProver(this)
  }

  @Memoize()
  get cachedMultiStorageSlotProver(): CachedMultiStorageSlotProver {
    return new CachedMultiStorageSlotProver(this)
  }

  @Memoize()
  get cachedStorageSlotProver(): CachedStorageSlotProver {
    return new CachedStorageSlotProver(this)
  }

  @Memoize()
  get logProver(): LogProver {
    return new LogProver(this)
  }

  @Memoize()
  get multiStorageSlotProver(): MultiStorageSlotProver {
    return new MultiStorageSlotProver(this)
  }

  @Memoize()
  get storageSlotProver(): StorageSlotProver {
    return new StorageSlotProver(this)
  }

  @Memoize()
  get transactionProver(): TransactionProver {
    return new TransactionProver(this)
  }

  @Memoize()
  get withdrawalProver(): WithdrawalProver {
    return new WithdrawalProver(this)
  }
}
