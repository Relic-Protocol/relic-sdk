import { BigNumber, BigNumberish, utils } from 'ethers'
import { SlotValueMismatch } from '../errors'

const abiCoder = utils.defaultAbiCoder

export function mapElemSlot(base: BigNumberish, key: BigNumberish): BigNumber {
  return BigNumber.from(
    utils.keccak256(abiCoder.encode(['uint256', 'uint256'], [key, base]))
  )
}

export function staticArrayElemSlot(
  base: BigNumberish,
  idx: BigNumberish,
  slotsPerElem: BigNumberish
): BigNumber {
  return BigNumber.from(base).add(BigNumber.from(idx).mul(slotsPerElem))
}

export function dynamicArrayElemSlot(
  base: BigNumberish,
  idx: BigNumberish,
  slotsPerElem: BigNumberish
): BigNumber {
  const eltsSlot = BigNumber.from(
    utils.keccak256(abiCoder.encode(['uint256'], [base]))
  )
  return eltsSlot.add(BigNumber.from(idx).mul(slotsPerElem))
}

export function structFieldSlot(
  base: BigNumberish,
  offset: BigNumberish
): BigNumber {
  return BigNumber.from(base).add(offset)
}

export function assertSlotValue(value: BigNumberish, expected: BigNumberish) {
  const v0 = BigNumber.from(value)
  const v1 = BigNumber.from(expected)
  if (!v0.eq(v1)) {
    throw new SlotValueMismatch(v0, v1)
  }
}
