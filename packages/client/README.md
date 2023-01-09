# Relic Client SDK

The client SDK is designed to simplify fetching proofs from the Relic Prover and generating transaction data to be submitted on-chain for verification.

![Relic Architecture Overview](https://miro.medium.com/max/1400/1*c8jPRfDNS_KCQADhBQNhYg.png)

## Usage

Initializing `RelicClient` requires passing an [`ethers` Provider](https://docs.ethers.io/v5/api/providers/). Providers can be created with an RPC url or by [connecting to Metamask](https://docs.ethers.io/v5/getting-started/#getting-started--connecting) or another wallet extension.

```typescript
import { RelicClient, utils } from '@relicprotocol/client'
import { ethers } from 'ethers'

async function main() {
  // Note: you could also get the provider from a browser wallet extension
  const provider = new ethers.providers.JsonRpcProvider('[RPC URL here]')
  const signer = provider.getSigner()

  const relic = await RelicClient.fromProvider(provider)

  // prove an account's birth certificate
  const birthCertificateProver = await relic.birthCertificateProver()
  const account = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' // vitalik.eth
  const bcTx = await birthCertificateProver.prove({ account })

  console.log(await provider.estimateGas(bcTx))

  // use the transaction data...
  // to send the proof transaction as is:
  // let tx = await signer.sendTransaction(bcTx)
  // await tx.wait()

  // prove a storage slot's value, in this case WETH.balanceOf(account)
  const storageSlotProver = await relic.storageSlotProver()
  const blockNum = 15000000
  const wethAddr = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' // WETH
  const slot = utils.mapElemSlot(3, account) // calculate balanceOf(account) slot

  // you can optionally specify the expected slot value, to ensure the slot is correct
  // we'll compute this by calling balanceOf(account) at the target block
  const contract = new ethers.Contract(
    wethAddr,
    ['function balanceOf(address) external view returns (uint256)'],
    provider
  )
  const expected = await contract.balanceOf(account, { blockTag: blockNum })

  // expected is optional parameter
  const ssTx = await storageSlotProver.prove({
    block: blockNum,
    account: wethAddr,
    slot,
    expected,
  })

  // use the transaction data...
  console.log(await provider.estimateGas(ssTx))
}

main()
```
