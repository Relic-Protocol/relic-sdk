import type {
  AttendanceProof,
  BirthCertificateProof,
  StorageSlotProof,
} from '@relicprotocol/types'

import { ethers } from 'ethers'
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

export class RelicAPI {
  private instance: AxiosInstance

  constructor(apiUrl: string) {
    this.instance = axios.create({ baseURL: apiUrl })
  }

  private _fetch<R>(req: AxiosRequestConfig): Promise<R> {
    return new Promise<R>((resolve, reject) =>
      this.instance
        .request(req)
        .then(({ data }: AxiosResponse<R>) => {
          resolve(data)
        })
        .catch((error: AxiosError) => {
          reject(error)
        })
    )
  }

  async birthCertificateProof(address: string): Promise<BirthCertificateProof> {
    return await this._fetch<BirthCertificateProof>({
      method: 'get',
      url: `/birthcert/${ethers.utils.getAddress(address)}`,
    })
  }

  async attendanceProof(
    address: string,
    eventId: ethers.BigNumberish,
    code: string
  ): Promise<AttendanceProof> {
    return await this._fetch<AttendanceProof>({
      method: 'get',
      url: '/attendance',
      params: {
        event: ethers.BigNumber.from(eventId).toString(),
        code: code,
        account: ethers.utils.getAddress(address),
      },
    })
  }

  async storageSlotProof(
    block: number,
    address: string,
    slot: ethers.BigNumberish
  ): Promise<StorageSlotProof> {
    return await this._fetch<StorageSlotProof>({
      method: 'get',
      url: `/storage/${block}/${ethers.utils.getAddress(
        address
      )}/${ethers.utils.hexlify(slot)}`,
    })
  }
}
