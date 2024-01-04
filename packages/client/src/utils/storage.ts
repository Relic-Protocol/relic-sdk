import { BigNumber, BigNumberish, utils } from 'ethers'
import { SlotValueMismatch } from '../errors'

const abiCoder = utils.defaultAbiCoder

export function toBytes32(num: BigNumberish): string {
  return abiCoder.encode(['uint256'], [BigNumber.from(num)])
}

export function mapElemSlot(base: BigNumberish, key: BigNumberish): string {
  return utils.keccak256(abiCoder.encode(['uint256', 'uint256'], [key, base]))
}

export function staticArrayElemSlot(
  base: BigNumberish,
  idx: BigNumberish,
  slotsPerElem: BigNumberish
): string {
  return toBytes32(
    BigNumber.from(base).add(BigNumber.from(idx).mul(slotsPerElem))
  )
}

export function dynamicArrayElemSlot(
  base: BigNumberish,
  idx: BigNumberish,
  slotsPerElem: BigNumberish
): string {
  const eltsSlot = BigNumber.from(utils.keccak256(toBytes32(base)))
  return toBytes32(eltsSlot.add(BigNumber.from(idx).mul(slotsPerElem)))
}

export function structFieldSlot(
  base: BigNumberish,
  offset: BigNumberish
): string {
  return toBytes32(BigNumber.from(base).add(offset))
}

export function assertSlotValue(value: BigNumberish, expected: BigNumberish) {
  const v0 = BigNumber.from(value)
  const v1 = BigNumber.from(expected)
  if (!v0.eq(v1)) {
    throw new SlotValueMismatch(v0, v1)
  }
}
