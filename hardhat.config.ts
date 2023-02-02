import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-ethers'
import '@nomicfoundation/hardhat-chai-matchers'
import 'solidity-docgen'

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
  docgen: {
    outputDir: './docs/solidity-sdk',
    templates: './docgen-templates/',
    pages: 'single',
    exclude: ['test'],
  },
}

export default config
