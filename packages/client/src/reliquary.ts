import { ethers } from 'ethers'
import { abi } from '@relicprotocol/contracts/abi/IReliquary.json'

export class Reliquary {
  contract: ethers.Contract

  constructor(provider: ethers.providers.Provider, address: string) {
    this.contract = new ethers.Contract(address, abi, provider)
  }
}
