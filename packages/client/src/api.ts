import { ethers } from 'ethers'
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'

export type BirthCertificateProof = {
  account: string
  accountProof: string
  header: string
  blockProof: string
}

export type AttendanceProof = {
  account: string
  eventId: string
  number: string
  signatureInner: string
  signatureOuter: string
}

export type StorageSlotProof = {
  account: string
  accountProof: string
  slot: string
  slotValue: string
  slotProof: string
  header: string
  blockProof: string
}

export class RelicAPI {
  instance: AxiosInstance

  constructor(apiUrl: string) {
    this.instance = axios.create({ baseURL: apiUrl })
  }

  _fetch<R>(req: AxiosRequestConfig): Promise<R> {
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
    slot: ethers.BigNumberish,
  ): Promise<StorageSlotProof> {
    return await this._fetch<StorageSlotProof>({
      method: 'get',
      url: `/storage/${block}/${ethers.utils.getAddress(
        address
      )}/${ethers.utils.hexlify(slot)}`,
    })
  }
}
