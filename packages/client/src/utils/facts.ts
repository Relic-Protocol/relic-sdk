import { BigNumberish, utils } from 'ethers'

const abiCoder = utils.defaultAbiCoder

export function birthCertificateSigData() {
  return abiCoder.encode(['string'], ['BirthCertificate'])
}

export function storageSlotSigData(slot: BigNumberish, blockNum: number) {
  return abiCoder.encode(
    ['string', 'bytes32', 'uint256'],
    ['StorageSlot', slot, blockNum]
  )
}

export function blockHeaderSigData(blockNum: number) {
  return abiCoder.encode(['string', 'uint256'], ['BlockHeader', blockNum])
}

export function accountStorageSigData(
  blockNum: number,
  storageRoot: BigNumberish
) {
  return abiCoder.encode(
    ['string', 'uint256', 'bytes32'],
    ['AccountStorage', blockNum, storageRoot]
  )
}

export function logSigData(blockNum: number, txIdx: number, logIdx: number) {
  return abiCoder.encode(
    ['string', 'uint256', 'uint256', 'uint256'],
    ['Log', blockNum, txIdx, logIdx]
  )
}

export function eventSigData(eventID: BigNumberish) {
  return abiCoder.encode(
    ['string', 'string', 'uint64'],
    ['EventAttendance', 'EventID', eventID]
  )
}
