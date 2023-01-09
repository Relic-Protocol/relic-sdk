import { expect } from 'chai'
import { ethers } from 'hardhat'

describe('Storage parse', function () {
  it('test parsing', async function () {
    const StorageParseTest = await ethers.getContractFactory('StorageParseTest')
    const spt = await StorageParseTest.deploy()
    await spt.deployed()

    // test that too much data reverts
    await expect(
      spt.testParseUint64('0xaaaaaaaaaaaaaaaaaa')
    ).to.be.revertedWith('data is not a uint64')

    // test that too much data reverts
    expect(await spt.testParseUint64('0xaaaaaaaaaaaaaaaa')).to.equal(
      ethers.BigNumber.from('0xaaaaaaaaaaaaaaaa')
    )

    // test leading zeros get addedd
    expect(
      await spt.testParseAddress('0x111111111111111111111111111111111111')
    ).to.equal(
      ethers.utils.getAddress('0x0000111111111111111111111111111111111111')
    )

    // test that too much data reverts
    await expect(
      spt.testParseAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    ).to.be.revertedWith('data is not an address')
  })
})
