import type { RelicConfig, RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'

import { RelicAPI } from './api'
import { UnsupportedNetwork } from './errors'
import {
  AccountStorageProver,
  AttendanceProver,
  BlockHeaderProver,
  BirthCertificateProver,
  StorageSlotProver,
  CachedStorageSlotProver,
  MultiStorageSlotProver,
} from './provers'
import { Reliquary } from './reliquary'

import { LogProver } from './provers/log'

const defaultConfig: Record<number, RelicConfig> = {
  // mainnet
  1: {
    apiUrl: 'https://api.mainnet.relicprotocol.com/v1',
    addresses: {
      reliquary: '0x5E4DE6Bb8c6824f29c44Bd3473d44da120387d08',
      ephemeralFacts: '0xBD73A29A4775d856f311115471bad401ca39A048',
      attendanceProver: '0x82Ce91E7a5198334e4c9629f64B62B75401dBa86',
      birthCertificateProver: '0x8c3fcf00178b87Dc3eF5A95533E321D69f694c4e',
      storageSlotProver: '0xB8E9ebd4518E44eE66808ab27c9E09E5c5CCA2db',
      logProver: '0x95Ec567b7bc3E5Aa7c581B44dc3028Fa417c297F',
      blockHeaderProver: '0x9f9A1eb0CF9340538297c853915DCc06Eb6D72c4',
      accountStorageProver: '0xa0334AD349c1D805BF6c9e42125845B7D4F63aDe',
      cachedStorageSlotProver: '0x2e1A0F428624D85c2c86be18ccf57981b3e9b54D',
      multiStorageSlotProver: '0x2758db4b9CeB4a2b1762164D0bBf7024009F6ee4',
    },
  },
}

export class RelicClient {
  readonly provider: ethers.providers.Provider
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

  constructor(provider: ethers.providers.Provider, config: RelicConfig) {
    this.provider = provider
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
  }

  static async fromProvider(
    provider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    const network = await provider.getNetwork()
    if (defaultConfig[network.chainId] === undefined) {
      throw new UnsupportedNetwork()
    }
    const config = Object.assign(
      {},
      defaultConfig[network.chainId],
      configOverride
    )
    return new RelicClient(provider, config)
  }
}
