import { BigNumberish } from 'ethers'
import { ZeroExString } from './utils'

export interface Proof {}

export interface AttendanceProof extends Proof {
  account: ZeroExString
  eventId: string
  number: BigNumberish
  signatureInner: ZeroExString
  signatureOuter: ZeroExString
}

export interface BirthCertificateProof extends Proof {
  account: ZeroExString
  accountProof: ZeroExString
  header: ZeroExString
  blockProof: ZeroExString
}

export interface StorageSlotProof extends Proof {
  account: ZeroExString
  accountProof: ZeroExString
  slot: BigNumberish
  slotValue: BigNumberish
  slotProof: ZeroExString
  header: ZeroExString
  blockProof: ZeroExString
}
