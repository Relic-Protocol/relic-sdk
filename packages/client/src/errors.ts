import { BigNumber, BigNumberish, ethers } from 'ethers'
import { hexValue } from 'ethers/lib/utils'

export class RelicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RelicError'
  }
}

export class UnknownError extends RelicError {
  constructor(message: string) {
    super(message)
  }
}

export class UnsupportedNetwork extends RelicError {
  constructor() {
    super('unsupported network')
  }
}

export class InvalidDataProvider extends RelicError {
  constructor(executionChainId: number, dataChainIds: Array<string>) {
    super(
      `network ${executionChainId} requires a dataProvider for one ` +
        `of the following networks: ${dataChainIds}`
    )
  }
}

export class SlotValueMismatch extends RelicError {
  constructor(value: BigNumber, expected: BigNumber) {
    super(
      `slot value didn't match expected: ${value.toHexString()} vs ${expected.toHexString()}`
    )
  }
}

export class TransactionHashMismatch extends RelicError {
  constructor(value: BigNumberish, expected: BigNumberish) {
    super(
      `tx hash didn't match expected: ${hexValue(value)} vs ${hexValue(
        expected
      )}`
    )
  }
}

export class NoBridger extends RelicError {
  constructor(chainId: number, dataChainId: number) {
    super(
      `network ${chainId} with data network ${dataChainId} does not have a bridger`
    )
  }
}

export class L1BlockHashNotAccessible extends RelicError {
  constructor(chainId: number) {
    super(`network ${chainId} doesn't expose L1 block hash`)
  }
}

export class NotNativeL2 extends RelicError {
  constructor(chainId: number, dataChainId: number) {
    super(
      `network ${chainId} with data network ${dataChainId} is not a native L2 config`
    )
  }
}

export class NotL1Network extends RelicError {
  constructor(chainId: number) {
    super(`${chainId} is not an L1 network`)
  }
}

export class UnsupportedProvider extends RelicError {
  constructor(provider: ethers.providers.Provider) {
    const providerType = typeof provider
    super(`provider type ${providerType} is not supported`)
  }
}

export class BridgeNotNecessary extends RelicError {
  constructor(block: ethers.providers.BlockTag) {
    super(
      `block ${block} does not need to be bridged; it can already be verified. ` +
        `call this function with force=true to override this check`
    )
  }
}

export class BlockNotVerifiable extends RelicError {
  constructor(block: ethers.providers.BlockTag, chainId: number) {
    super(
      `block ${block} is not verifiable on chainId ${chainId}. ` +
        `you may need to wait for a merkle root import, or bridge ` +
        `the block hash manually using RelicClient.bridge.sendBlock`
    )
  }
}

export class TimestampAfterCurrent extends RelicError {
  constructor(timestamp: number) {
    super(`timestamp ${timestamp} is after current block's timestamp`)
  }
}

export class UnexpectedSlotTime extends RelicError {
  constructor(timestamp: number) {
    super(`block timestamp ${timestamp} is unexpected`)
  }
}

enum ErrorMsg {
  ACCOUNT_NOT_FOUND = 'Account info not available',
  INVALID_EVENTID = 'Invalid eventId',
  EVENTID_NOT_FOUND = 'EventId not found',
  EVENT_CODE_MISTYPED = 'Event code mistyped',
  EVENT_CODE_NOT_FOUND = 'Event code not found',
  INVALID_BLOCK = 'Error parsing request query',
  BLOCKNUM_NOT_FOUND = 'Block number not available',
  BLOCK_NOT_FOUND = 'Block header not available',
  INVALID_ROOT = 'Invalid root number',
  INVALID_ARG = 'Invalid argument',
  ROOT_NOT_FOUND = 'Root not found',
}

type Msg = keyof typeof ErrorMsg

export abstract class RelicApiError extends RelicError {
  constructor(err: Msg) {
    super(ErrorMsg[err])
  }
}

export class AccountNotFound extends RelicApiError {
  constructor() {
    super('ACCOUNT_NOT_FOUND')
  }
}
export class InvalidEventId extends RelicApiError {
  constructor() {
    super('INVALID_EVENTID')
  }
}
export class EventIdNotFound extends RelicApiError {
  constructor() {
    super('EVENTID_NOT_FOUND')
  }
}
export class EventCodeMistyped extends RelicApiError {
  constructor() {
    super('EVENT_CODE_MISTYPED')
  }
}
export class EventCodeNotFound extends RelicApiError {
  constructor() {
    super('EVENT_CODE_NOT_FOUND')
  }
}
export class InvalidBlock extends RelicApiError {
  constructor() {
    super('INVALID_BLOCK')
  }
}
export class BlockNumNotFound extends RelicApiError {
  constructor() {
    super('BLOCKNUM_NOT_FOUND')
  }
}
export class BlockNotFound extends RelicApiError {
  constructor() {
    super('BLOCK_NOT_FOUND')
  }
}
export class InvalidRoot extends RelicApiError {
  constructor() {
    super('INVALID_ROOT')
  }
}
export class RootNotFound extends RelicApiError {
  constructor() {
    super('ROOT_NOT_FOUND')
  }
}
export class InvalidArgument extends RelicApiError {
  constructor() {
    super('INVALID_ARG')
  }
}

const errorClassMap: { [m in Msg]: new () => RelicApiError } = {
  ACCOUNT_NOT_FOUND: AccountNotFound,
  INVALID_EVENTID: InvalidEventId,
  EVENTID_NOT_FOUND: EventIdNotFound,
  EVENT_CODE_MISTYPED: EventCodeMistyped,
  EVENT_CODE_NOT_FOUND: EventCodeNotFound,
  INVALID_BLOCK: InvalidBlock,
  BLOCKNUM_NOT_FOUND: BlockNumNotFound,
  BLOCK_NOT_FOUND: BlockNotFound,
  INVALID_ROOT: InvalidRoot,
  INVALID_ARG: InvalidArgument,
  ROOT_NOT_FOUND: RootNotFound,
}

export const API_ERROR_MAP: Record<string, new () => RelicApiError> =
  Object.fromEntries(
    (Object.keys(ErrorMsg) as Array<Msg>).map((err) => [
      ErrorMsg[err],
      errorClassMap[err],
    ])
  )
