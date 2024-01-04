import { ethers, BigNumber, BigNumberish } from 'ethers'
import { TimestampAfterCurrent } from '../errors'

export function blockNumberToChunk(blockNum: BigNumberish): number {
  return BigNumber.from(blockNum).div(8192).toNumber()
}

export async function blockForTimestamp(
  provider: ethers.providers.Provider,
  timestamp: number
): Promise<ethers.providers.Block> {
  const current = await provider.getBlock('latest')
  if (current.timestamp < timestamp) throw new TimestampAfterCurrent(timestamp)
  let start = await provider.getBlock(1)
  let end = current

  while (end.number - start.number > 1) {
    let quantile =
      (timestamp - start.timestamp) / (end.timestamp - start.timestamp)
    let nextNum =
      start.number + Math.floor((end.number - start.number) * quantile)
    if (nextNum == start.number) nextNum++
    if (nextNum == end.number) nextNum--
    let next = await provider.getBlock(nextNum)
    if (next.timestamp > timestamp) {
      end = next
    } else {
      start = next
    }
  }
  return start
}
