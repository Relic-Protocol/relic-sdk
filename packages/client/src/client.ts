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
  CachedMultiStorageSlotProver,
} from './provers'
import { Reliquary } from './reliquary'

import { LogProver } from './provers/log'

const defaultAPI: Record<number, string> = {
  // mainnet
  1: 'https://api.mainnet.relicprotocol.com/v1',
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
  readonly cachedMultiStorageSlotProver: CachedMultiStorageSlotProver

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
    this.cachedMultiStorageSlotProver = new CachedMultiStorageSlotProver(this)
  }

  static async fromProvider(
    provider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    const network = await provider.getNetwork()
    if (defaultAPI[network.chainId] === undefined) {
      throw new UnsupportedNetwork()
    }
    const apiUrl = configOverride?.apiUrl || defaultAPI[network.chainId]
    const addresses =
      configOverride?.addresses || (await new RelicAPI(apiUrl).addresses())

    const config: RelicConfig = { apiUrl, addresses }
    return new RelicClient(provider, config)
  }
}
