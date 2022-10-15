import { ethers } from 'ethers'

import { RelicAPI } from './api'
import { AttendanceProver } from './attendance'
import { BirthCertificateProver } from './birthcert'
import { Reliquary } from './reliquary'
import { StorageSlotProver } from './storage'

export type RelicAddresses = {
  reliquary: string
  attendanceProver: string
  birthCertificateProver: string
  storageSlotProver: string
}

export type RelicConfig = {
  apiUrl: string
  addresses: RelicAddresses
}

const defaultConfig: Record<number, RelicConfig> = {
  // mainnet
  1: {
    apiUrl: 'https://api.mainnet.relicprotocol.com/v1',
    addresses: {
      reliquary: '0x5E4DE6Bb8c6824f29c44Bd3473d44da120387d08',
      attendanceProver: '0x82Ce91E7a5198334e4c9629f64B62B75401dBa86',
      birthCertificateProver: '0x8666BA57318eAC09C84cD2E8C66046c9563a9D07',
      storageSlotProver: '0x01a66f3C4C1f37074eA297c01d4042C4145ef4eC',
    },
  },
}

export class RelicClient {
  provider: ethers.providers.Provider
  api: RelicAPI
  addresses: RelicAddresses

  constructor(provider: ethers.providers.Provider, config: RelicConfig) {
    this.provider = provider
    this.api = new RelicAPI(config.apiUrl)
    this.addresses = config.addresses
  }

  static async fromProvider(provider: ethers.providers.Provider, configOverride?: Partial<RelicConfig>) {
    const network = await provider.getNetwork()
    if (defaultConfig[network.chainId] === undefined) {
      throw new Error("unsupported network")
    }
    const config = Object.assign({}, defaultConfig[network.chainId], configOverride)
    return new RelicClient(provider, config)
  }

  async reliquary(): Promise<Reliquary> {
    return new Reliquary(this.provider, this.addresses.reliquary)
  }

  async attendanceProver(): Promise<AttendanceProver> {
    return new AttendanceProver(this.api, this.provider, this.addresses.attendanceProver)
  }

  async birthCertificateProver(): Promise<BirthCertificateProver> {
    return new BirthCertificateProver(this.api, this.provider, this.addresses.birthCertificateProver)
  }

  async storageSlotProver(): Promise<StorageSlotProver> {
    return new StorageSlotProver(this.api, this.provider, this.addresses.storageSlotProver)
  }
}
