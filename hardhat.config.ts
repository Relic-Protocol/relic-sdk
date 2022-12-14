import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'

const config: HardhatUserConfig = {
  solidity: '0.8.12',
  paths: {
    sources: './packages/contracts',
  },
  networks: {
    hardhat: {
      chainId: 1,
      forking: {
        url: process.env.MAINNET_RPC_URL || '',
      },
    },
  },
}

export default config
