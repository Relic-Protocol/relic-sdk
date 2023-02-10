import { BytesLike, ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IReliquary.json'
import { RelicClient } from './client'
import { RelicError } from './errors'

const FeeNoFeeFlag = 1
const FeeNativeFlag = 2

export type FactData = {
  exists: boolean
  version: number
  data: BytesLike
}

export class Reliquary {
  private contract: ethers.Contract

  constructor(client: RelicClient) {
    this.contract = new ethers.Contract(
      client.addresses.reliquary,
      abi,
      client.provider
    )
  }

  async getFee(proverAddress: string): Promise<ethers.BigNumber> {
    const proverInfo = await this.contract.provers(proverAddress)
    const { flags, feeWeiMantissa, feeWeiExponent } = proverInfo.feeInfo
    if (flags & FeeNoFeeFlag) {
      return ethers.BigNumber.from(0)
    }
    if (flags & FeeNativeFlag) {
      return ethers.BigNumber.from(feeWeiMantissa).mul(
        ethers.BigNumber.from(10).pow(feeWeiExponent)
      )
    }
    throw new RelicError('prover does not support native fees')
  }

  async getFact(address: string, factSig: BytesLike): Promise<FactData> {
    const [exists, version, data] = await this.contract.callStatic.debugVerifyFact(
      address,
      factSig,
      { from: '0x0000000000000000000000000000000000000000' },
    );

    return {
      exists,
      version,
      data,
    };
  }
}
