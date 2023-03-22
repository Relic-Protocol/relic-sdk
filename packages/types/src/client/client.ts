import { ZeroExString } from './utils'

export interface RelicAddresses {
  reliquary: ZeroExString
  ephemeralFacts: ZeroExString
  attendanceProver: ZeroExString
  birthCertificateProver: ZeroExString
  storageSlotProver: ZeroExString
  logProver: ZeroExString
  blockHeaderProver: ZeroExString
  accountStorageProver: ZeroExString
  cachedStorageSlotProver: ZeroExString
  multiStorageSlotProver: ZeroExString
  cachedMultiStorageSlotProver: ZeroExString
}

export interface RelicConfig {
  apiUrl: string
  addresses: RelicAddresses
}
