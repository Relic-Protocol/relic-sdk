import { ZeroExString } from './utils'

export interface RelicAddresses {
  reliquary: ZeroExString
  blockHistory: ZeroExString
  messenger: ZeroExString
  ephemeralFacts: ZeroExString
  accountInfoProver: ZeroExString
  accountStorageProver: ZeroExString
  attendanceProver: ZeroExString
  birthCertificateProver: ZeroExString
  blockHeaderProver: ZeroExString
  cachedMultiStorageSlotProver: ZeroExString
  cachedStorageSlotProver: ZeroExString
  logProver: ZeroExString
  multiStorageSlotProver: ZeroExString
  storageSlotProver: ZeroExString
  transactionProver: ZeroExString
  withdrawalProver: ZeroExString
}

export interface RelicConfig {
  apiUrl: string
  addresses: RelicAddresses
}
