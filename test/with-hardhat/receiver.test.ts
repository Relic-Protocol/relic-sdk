import { expect } from 'chai'
import { ethers } from 'hardhat'
import { RelicClient } from '../../packages/client/src'

const EPHEMERAL_FACTS_ADDRESS = '0xe9B8B4B2d7b747ef60D5aED7263ebF2839a1a891'

describe('RelicReceiver', function () {
  it('test fact receiving', async function () {
    const provider = ethers.provider

    const ephemeralFacts = await ethers.getContractAt(
      'IEphemeralFacts',
      EPHEMERAL_FACTS_ADDRESS
    )
    const RelicReceiver = await ethers.getContractFactory('RelicReceiverTest')
    const receiver = await RelicReceiver.deploy(ephemeralFacts.address)
    await receiver.deployed()

    const client = await RelicClient.fromProvider(provider)
    const prover = await client.storageSlotProver()

    const slot = '0x' + '0'.repeat(64)
    const blockNum = 15000000
    const data = ethers.utils.defaultAbiCoder.encode(
      ['string', 'bytes32', 'uint256'],
      ['StorageSlot', slot, blockNum]
    )

    const [signer] = await ethers.getSigners()
    const context = {
      initiator: signer.address,
      receiver: receiver.address,
      gasLimit: 1000000,
    }

    let call = await prover.proveEphemeral(
      {
        ...context,
        extra: data,
      },
      {
        block: 15000000,
        account: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        slot: 0,
      }
    )
    let tx = await signer.sendTransaction(call)
    await expect(tx).to.emit(receiver, 'StorageSlotFact')
  })
})
