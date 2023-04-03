import pkg from './package.json' assert { type: 'json' }
import createConfig from '../../rollup.config.mjs'

export default createConfig(
  'Relic',
  Object.keys({
    ...pkg.dependencies,
    ...pkg.peerDependencies,
  }),
  ['ethers', 'axios']
)
