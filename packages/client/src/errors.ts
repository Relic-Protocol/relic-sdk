import { BigNumber } from 'ethers'

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

export class SlotValueMismatch extends RelicError {
  constructor(value: BigNumber, expected: BigNumber) {
    super(`slot value didn't match expected: ${value} vs ${expected}`)
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
  ROOT_NOT_FOUND: RootNotFound,
}

export const API_ERROR_MAP: Record<string, new () => RelicApiError> =
  Object.fromEntries(
    (Object.keys(ErrorMsg) as Array<Msg>).map((err) => [
      ErrorMsg[err],
      errorClassMap[err],
    ])
  )
