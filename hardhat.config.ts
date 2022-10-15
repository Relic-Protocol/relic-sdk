import { HardhatUserConfig } from 'hardhat/config'
//import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: '0.8.12',
  paths: {
    sources: './packages/contracts',
  },
}

export default config
