// Note. https://github.com/WalletConnect/walletconnect-monorepo/blob/v2.0/rollup.config.js

import esbuild from 'rollup-plugin-esbuild'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

const input = './src/index.ts'

const plugins = [
  json(),
  nodeResolve({ preferBuiltins: false, browser: true }),
  commonjs(),
  esbuild({
    minify: true,
    tsconfig: './tsconfig.json',
  }),
]

export const createConfig = (name, external) => {
  return [
    {
      input,
      plugins,
      output: {
        file: './dist/index.umd.js',
        format: 'umd',
        exports: 'named',
        name,
        sourcemap: true,
      },
    },
    {
      input,
      plugins,
      external,
      output: [
        {
          file: './dist/index.cjs.js',
          format: 'cjs',
          exports: 'named',
          name,
          sourcemap: true,
        },
        {
          file: './dist/index.es.js',
          format: 'es',
          exports: 'named',
          name,
          sourcemap: true,
        },
      ],
    },
  ]
}

export default createConfig
