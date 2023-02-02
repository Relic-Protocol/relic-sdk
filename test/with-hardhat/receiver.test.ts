import { expect } from 'chai'
import { ethers } from 'hardhat'
import { RelicClient } from '../../packages/client'

describe('RelicReceiver', function () {
  it('test fact receiving', async function () {
    const provider = ethers.provider
    const relic = await RelicClient.fromProvider(provider)

    const ephemeralFacts = await ethers.getContractAt(
      'IEphemeralFacts',
      relic.addresses.ephemeralFacts
    )
    const RelicReceiver = await ethers.getContractFactory('RelicReceiverTest')
    const receiver = await RelicReceiver.deploy(ephemeralFacts.address)
    await receiver.deployed()

    const slot = '0x' + '0'.repeat(64)
    const blockNum = 15000000

    const [signer] = await ethers.getSigners()
    const context = {
      initiator: signer.address,
      receiver: receiver.address,
      gasLimit: 1000000,
    }

    let call = await relic.storageSlotProver.proveEphemeral(context, {
      block: 15000000,
      account: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      slot,
    })
    let tx = await signer.sendTransaction(call)
    await expect(tx).to.emit(receiver, 'StorageSlotFact')

    call = await relic.blockHeaderProver.proveEphemeral(context, {
      block: 15000000,
    })
    tx = await signer.sendTransaction(call)
    await expect(tx).to.emit(ephemeralFacts, 'ReceiveSuccess')
    await expect(tx).to.emit(receiver, 'BlockHeaderFact')
  })
})
