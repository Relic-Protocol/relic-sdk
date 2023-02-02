import { expect } from 'chai'
import { ethers } from 'hardhat'
import { RelicClient } from '../../packages/client'

const RELIQUARY_ADDRESS = '0x5E4DE6Bb8c6824f29c44Bd3473d44da120387d08'
const ADDR = '0xf979392E396dc53faB7B3C430dD385e73dD0A4e2'
const BIRTH_BLOCK = 15572049

describe('BirthCertificateVerifier', function () {
  it('test modifiers', async function () {
    const provider = ethers.provider

    const BirthCertificateVerifierTest = await ethers.getContractFactory(
      'BirthCertificateVerifierTest'
    )
    const deployed = await BirthCertificateVerifierTest.deploy(
      RELIQUARY_ADDRESS
    )
    await deployed.deployed()

    const impersonatedSigner = await ethers.getImpersonatedSigner(ADDR)
    const bcvt = await deployed.connect(impersonatedSigner)
    const fundTx = await (
      await ethers.getSigners()
    )[0].sendTransaction({ to: ADDR, value: '100000000000000000000' })
    await fundTx.wait()

    // check that it fails before proving a birth certificate
    expect(bcvt.testBornBeforeBlock(BIRTH_BLOCK + 1)).to.be.revertedWith(
      'account has no proven birth certificate'
    )

    const relic = await RelicClient.fromProvider(provider)

    // prove the birth certificate
    let tx = await impersonatedSigner.sendTransaction(
      await relic.birthCertificateProver.prove({ account: ADDR })
    )
    await tx.wait()

    // now it succeeds, but the previous block fails
    await bcvt.testBornBeforeBlock(BIRTH_BLOCK + 1)
    await expect(bcvt.testBornBeforeBlock(BIRTH_BLOCK)).to.be.revertedWith(
      'account is not old enough'
    )

    let block = await provider.getBlock(BIRTH_BLOCK)
    const birthTime = block.timestamp

    // test the timestamp modifiers
    await bcvt.testBornBefore(birthTime + 1)
    await expect(bcvt.testBornBefore(birthTime)).to.be.revertedWith(
      'account is not old enough'
    )

    block = await provider.getBlock()
    const curAge = block.timestamp - birthTime
    const curAgeBlocks = block.number - BIRTH_BLOCK

    await bcvt.testOlderThan(curAge - 1)
    await expect(bcvt.testOlderThan(curAge + 100)).to.be.revertedWith(
      'account is not old enough'
    )

    await bcvt.testOlderThanBlocks(curAgeBlocks - 1)
    await expect(
      bcvt.testOlderThanBlocks(curAgeBlocks + 100)
    ).to.be.revertedWith('account is not old enough')
  })
})
