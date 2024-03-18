import { API_ERROR_MAP, RelicError, UnknownError } from './errors'

import type {
  AccountProof,
  AttendanceProof,
  BlockProof,
  LogProof,
  StorageSlotProof,
  TransactionProof,
  WithdrawalProof,
  ErrorResult,
  RelicAddresses,
} from '@relicprotocol/types'

import { ethers } from 'ethers'
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

import axiosRetry from 'axios-retry'

function makeError(
  response: AxiosResponse<ErrorResult> | undefined
): RelicError {
  if (!response) {
    throw new UnknownError('No response data from API')
  }
  const constructor = API_ERROR_MAP[response.data.error]
  return constructor ? new constructor() : new UnknownError(response.data.error)
}

export class RelicAPI {
  private instance: AxiosInstance
  private baseBlock: number | undefined

  constructor(apiUrl: string) {
    this.instance = axios.create({ baseURL: apiUrl })

    // exponential backoff when rate limited
    axiosRetry(this.instance, {
      retries: 10,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => error.response?.status == 429,
    })
  }

  private _fetch<R>(req: AxiosRequestConfig): Promise<R> {
    if (this.baseBlock !== undefined) {
      req.params = {
        ...(req.params || {}),
        baseBlock: this.baseBlock.toString(),
      }
    }
    return this.instance
      .request(req)
      .then(({ data }: AxiosResponse<R>) => data)
      .catch((error: AxiosError<ErrorResult>) => {
        throw makeError(error.response)
      })
  }

  setBaseBlock(baseBlock: number) {
    this.baseBlock = baseBlock
  }

  accountProof(
    block: ethers.providers.BlockTag,
    address: string
  ): Promise<AccountProof> {
    return this._fetch<AccountProof>({
      method: 'get',
      url: `/account/${block}/${ethers.utils.getAddress(address)}`,
    })
  }

  addresses(chainId: number): Promise<RelicAddresses> {
    return this._fetch<RelicAddresses>({
      method: 'get',
      url: `/addresses/${chainId}`,
    })
  }

  attendanceProof(
    address: string,
    eventId: ethers.BigNumberish,
    code: string
  ): Promise<AttendanceProof> {
    return this._fetch<AttendanceProof>({
      method: 'get',
      url: '/attendance',
      params: {
        event: ethers.BigNumber.from(eventId).toString(),
        code: code,
        account: ethers.utils.getAddress(address),
      },
    })
  }

  birthCertificateProof(address: string): Promise<AccountProof> {
    return this._fetch<AccountProof>({
      method: 'get',
      url: `/birthcert/${ethers.utils.getAddress(address)}`,
    })
  }

  blockProof(block: ethers.providers.BlockTag): Promise<BlockProof> {
    return this._fetch<BlockProof>({
      method: 'get',
      url: `/block/${block}`,
    })
  }

  logProof(
    block: ethers.providers.BlockTag,
    txIdx: number,
    logIdx: number
  ): Promise<LogProof> {
    return this._fetch<LogProof>({
      method: 'get',
      url: `/log/${block}/${txIdx}/${logIdx}`,
    })
  }

  storageSlotProof(
    block: ethers.providers.BlockTag,
    address: string,
    slot: ethers.BigNumberish
  ): Promise<StorageSlotProof> {
    return this._fetch<StorageSlotProof>({
      method: 'get',
      url: `/storage/${block}/${ethers.utils.getAddress(
        address
      )}/${ethers.utils.hexlify(slot)}`,
    })
  }

  transactionProof(
    block: ethers.providers.BlockTag,
    txIdx: number
  ): Promise<TransactionProof> {
    return this._fetch<TransactionProof>({
      method: 'get',
      url: `/transaction/${block}/${txIdx}`,
    })
  }

  withdrawalProof(
    block: ethers.providers.BlockTag,
    idx: number
  ): Promise<WithdrawalProof> {
    return this._fetch<WithdrawalProof>({
      method: 'get',
      url: `/withdrawal/${block}/${idx}`,
    })
  }
}
