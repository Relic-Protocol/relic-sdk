import pkg from './package.json' assert { type: 'json' }
import createConfig from '../../rollup.config.mjs'

export default createConfig(pkg.name, Object.keys(pkg.dependencies))
