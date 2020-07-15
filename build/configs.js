const path = require('path')
const camelcase = require('camelcase')
const cjs = require('rollup-plugin-commonjs')
const node = require('rollup-plugin-node-resolve')
const buble = require('rollup-plugin-buble')
const replace = require('rollup-plugin-replace')

const package = require('../package.json')
const external = Object.keys(package.dependencies).filter(
  (key) => key !== 'path-to-regexp'
)
const version = process.env.VERSION || package.version
const libraryName = process.env.LIBRARY_NAME || package.name

const banner = `/*!
  * ${libraryName} v${version}
  * (c) ${new Date().getFullYear()} GivingWu
  * @license MIT
  */`

const resolve = (_path) => path.resolve(__dirname, '../', _path)

module.exports = [
  // browser dev
  {
    file: resolve('dist/' + libraryName + '.js'),
    format: 'umd',
    env: 'development'
  },
  {
    file: resolve('dist/' + libraryName + '.min.js'),
    format: 'umd',
    env: 'production'
  },
  {
    file: resolve('dist/' + libraryName + '.common.js'),
    format: 'cjs'
  },
  {
    file: resolve('dist/' + libraryName + '.esm.js'),
    format: 'es'
  },
  {
    file: resolve('dist/' + libraryName + '.esm.browser.js'),
    format: 'es',
    env: 'development',
    transpile: false
  },
  {
    file: resolve('dist/' + libraryName + '.esm.browser.min.js'),
    format: 'es',
    env: 'production',
    transpile: false
  }
].map(genConfig)

function genConfig(opts) {
  const config = {
    input: {
      input: resolve('src/index.js'),
      external,
      plugins: [
        node(),
        cjs(),
        opts.format !== 'cjs' &&
          replace({
            __VERSION__: version,
            'process.env.VUE_APP_MASTER': true,
            'process.env.VUE_APP_PORTAL': undefined
          })
      ].filter(Boolean)
    },
    output: {
      file: opts.file,
      format: opts.format,
      banner,
      name: camelcase(libraryName, { pascalCase: true }),
      globals: {
        vue: 'Vue',
        'vue-router': 'VueRouter'
      },
      onwarn: (msg, warn) => {
        if (!/Circular/.test(msg)) {
          warn(msg)
        }
      }
    }
  }

  if (opts.env) {
    config.input.plugins.unshift(
      replace({
        'process.env.NODE_ENV': JSON.stringify(opts.env)
      })
    )
  }

  if (opts.transpile !== false) {
    config.input.plugins.push(buble())
  }

  return config
}
