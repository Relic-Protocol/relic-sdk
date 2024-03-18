import { providers, utils } from 'ethers'
import {
  NotL1Network,
  UnexpectedSlotTime,
  UnsupportedProvider,
} from '../errors'

export enum ChainId {
  EthMainnet = 1,
  EthSepolia = 11155111,
  ZkSyncMainnet = 324,
  ZkSyncSepolia = 300,
  OpMainnet = 10,
  OpSepolia = 11155420,
  BaseMainnet = 8453,
  BaseSepolia = 84532,
}

const BEACON_GENESIS_TIMESTAMP: Record<number, number> = {
  [ChainId.EthMainnet]: 1606824023,
  [ChainId.EthSepolia]: 1655733600,
}

const TIME_PER_SLOT = 12

export function isL1ChainId(chainId: number) {
  return chainId == ChainId.EthMainnet || chainId == ChainId.EthSepolia
}

export function isZkSyncChainId(chainId: number) {
  return chainId == ChainId.ZkSyncMainnet || chainId == ChainId.ZkSyncSepolia
}

export function isOptimismChainId(chainId: number) {
  return (
    chainId == ChainId.OpMainnet ||
    chainId == ChainId.OpSepolia ||
    chainId == ChainId.BaseMainnet ||
    chainId == ChainId.BaseSepolia
  )
}

export function isL2ChainId(chainId: number) {
  return isZkSyncChainId(chainId) || isOptimismChainId(chainId)
}

export function isProxyL2Deployment(chainId: number, dataChainId: number) {
  return isL2ChainId(chainId) && isL1ChainId(dataChainId)
}

export function beaconGenesisTimestamp(chainId: number): number {
  if (!isL1ChainId(chainId)) {
    throw new NotL1Network(chainId)
  }
  return BEACON_GENESIS_TIMESTAMP[chainId]
}

export function timestampToSlot(timestamp: number, chainId: number): number {
  if (!isL1ChainId(chainId)) {
    throw new NotL1Network(chainId)
  }
  const timeDiff = timestamp - BEACON_GENESIS_TIMESTAMP[chainId]
  if (timeDiff % TIME_PER_SLOT != 0) {
    throw new UnexpectedSlotTime(timestamp)
  }
  return timeDiff / TIME_PER_SLOT
}

export function slotToTimestamp(slot: number, chainId: number): number {
  if (!isL1ChainId(chainId)) {
    throw new NotL1Network(chainId)
  }
  return BEACON_GENESIS_TIMESTAMP[chainId] + TIME_PER_SLOT * slot
}

export function getConnectionInfo(
  provider: providers.Provider
): utils.ConnectionInfo {
  let obj = provider as any
  if (!obj.connection || !obj.connection.url) {
    throw new UnsupportedProvider(provider)
  }
  return obj.connection as utils.ConnectionInfo
}

export async function getLogs(
  provider: providers.Provider,
  filter: providers.Filter
) {
  filter = {
    ...filter,
    fromBlock: 0,
  }
  let logs: Array<providers.Log>
  while (true) {
    try {
      logs = await provider.getLogs(filter)
    } catch (e: any) {
      // ProviderError: no backends available for method
      if (e.code !== -32011) {
        throw e
      }
      continue
    }
    return logs
  }
}
