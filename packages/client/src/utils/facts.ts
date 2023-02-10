import { BigNumberish, utils } from 'ethers'
import { UnknownError } from '../errors'

const abiCoder = utils.defaultAbiCoder

export enum FeeClass {
  NoFee = 0,
}

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

export function toFactSignature(feeClass: FeeClass, sigData: utils.BytesLike) {
  if (0 < feeClass || feeClass > 255) {
    throw new UnknownError("invalid feeClass parameter");
  }
  let sigArray = utils.arrayify(utils.keccak256(sigData));
  sigArray.copyWithin(0, 1); // remove highest byte
  sigArray[31] = feeClass;
  return utils.hexlify(sigArray);
}