import { BigNumberish } from 'ethers'
import { ZeroExString } from './utils'


export interface ErrorResult {
  error: string
}

export interface Proof { }

export interface AccountProof extends BaseAccountProof {
  balance: BigNumberish
  nonce: number
  codeHash: ZeroExString
  storageHash: ZeroExString
}

export interface AttendanceProof extends Proof {
  account: ZeroExString
  eventId: string
  number: BigNumberish
  signatureInner: ZeroExString
  signatureOuter: ZeroExString
}

export interface BaseAccountProof extends BlockProof {
  account: ZeroExString
  accountProof: ZeroExString
}

export interface BlockProof extends Proof {
  blockNum: number
  header: ZeroExString
  blockProof: ZeroExString
}

export interface LogProof extends BlockProof {
  txIdx: number
  logIdx: number
  receiptProof: ZeroExString
}

export interface StorageSlotProof extends BaseAccountProof {
  slot: BigNumberish
  slotValue: BigNumberish
  slotProof: ZeroExString
}

export interface TransactionProof extends BlockProof {
  txProof: ZeroExString
  txIdx: number
  txHash: BigNumberish
}

export interface WithdrawalProof extends BlockProof {
  idx: number
  withdrawalProof: ZeroExString
}