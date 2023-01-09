import { ZeroExString } from './utils'

export interface RelicAddresses {
  reliquary: ZeroExString
  ephemeralFacts: ZeroExString
  attendanceProver: ZeroExString
  birthCertificateProver: ZeroExString
  storageSlotProver: ZeroExString
}

export interface RelicConfig {
  apiUrl: string
  addresses: RelicAddresses
}
