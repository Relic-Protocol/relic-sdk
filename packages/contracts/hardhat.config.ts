import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'

const config: HardhatUserConfig = {
  solidity: '0.8.12',
  paths: {
    sources: '.',
  },
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        blockNumber: 15770000,
        url: process.env.MAINNET_RPC_URL || '',
      },
    },
  },
}

export default config
