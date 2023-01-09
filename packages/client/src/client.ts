import type { RelicConfig, RelicAddresses } from '@relicprotocol/types'
import { ethers } from 'ethers'

import { RelicAPI } from './api'
import {
  AttendanceProver,
  BirthCertificateProver,
  StorageSlotProver,
} from './provers'
import { Reliquary } from './reliquary'

const defaultConfig: Record<number, RelicConfig> = {
  // mainnet
  1: {
    apiUrl: 'https://api.mainnet.relicprotocol.com/v1',
    addresses: {
      reliquary: '0x5E4DE6Bb8c6824f29c44Bd3473d44da120387d08',
      ephemeralFacts: '0xe9B8B4B2d7b747ef60D5aED7263ebF2839a1a891',
      attendanceProver: '0x82Ce91E7a5198334e4c9629f64B62B75401dBa86',
      birthCertificateProver: '0x8c3fcf00178b87Dc3eF5A95533E321D69f694c4e',
      storageSlotProver: '0xB8E9ebd4518E44eE66808ab27c9E09E5c5CCA2db',
    },
  },
}

export class RelicClient {
  private provider: ethers.providers.Provider
  private api: RelicAPI
  private addresses: RelicAddresses

  constructor(provider: ethers.providers.Provider, config: RelicConfig) {
    this.provider = provider
    this.api = new RelicAPI(config.apiUrl)
    this.addresses = config.addresses
  }

  static async fromProvider(
    provider: ethers.providers.Provider,
    configOverride?: Partial<RelicConfig>
  ) {
    const network = await provider.getNetwork()
    if (defaultConfig[network.chainId] === undefined) {
      throw new Error('unsupported network')
    }
    const config = Object.assign(
      {},
      defaultConfig[network.chainId],
      configOverride
    )
    return new RelicClient(provider, config)
  }

  async reliquary(): Promise<Reliquary> {
    return new Reliquary(this.provider, this.addresses.reliquary)
  }

  async attendanceProver(): Promise<AttendanceProver> {
    return new AttendanceProver(this.api, this.provider, this.addresses)
  }

  async birthCertificateProver(): Promise<BirthCertificateProver> {
    return new BirthCertificateProver(this.api, this.provider, this.addresses)
  }

  async storageSlotProver(): Promise<StorageSlotProver> {
    return new StorageSlotProver(this.api, this.provider, this.addresses)
  }
}
