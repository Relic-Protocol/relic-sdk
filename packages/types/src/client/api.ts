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

export interface BlockProof extends Proof {
  blockNum: number
  header: ZeroExString
  blockProof: ZeroExString
}

export interface BaseAccountProof extends BlockProof {
  account: ZeroExString
  accountProof: ZeroExString
}

export interface AccountProof extends BaseAccountProof {
  balance: BigNumberish
  nonce: number
  codeHash: ZeroExString
  storageHash: ZeroExString
}

export interface StorageSlotProof extends BaseAccountProof {
  slot: BigNumberish
  slotValue: BigNumberish
  slotProof: ZeroExString
}

export interface LogProof extends BlockProof {
  txIdx: number
  logIdx: number
  receiptProof: ZeroExString
}

export interface ErrorResult {
  error: string
}
