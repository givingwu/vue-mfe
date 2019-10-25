const { resolve } = require('path')

module.exports = {
  // outputDir: resolve('../root-app/public'), // build it into root-app to make them be served
  configureWebpack: {
    entry: resolve('./src/main.js'),
    devtool: false,
    output: {
      path: resolve('./dist'),
      library: {
        root: '__domain__app__lazy',
        amd: 'lazy',
        commonjs: 'lazy'
      },
      libraryTarget: 'umd',
      filename: 'js/' + 'lazy' + '-[chunkhash:8].umd.js',
      // libraryExport: name,
      chunkLoadTimeout: 120000,
      crossOriginLoading: 'anonymous'
    },
    externals: {
      axios: 'axios',
      vue: 'Vue',
      vuex: 'Vuex',
      'vue-router': 'VueRouter',
      'vue-mfe': 'VueMfe',
      'vue-types': 'VueTypes'
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          vendors: {
            name: 'lazy' + '-' + 'chunk-vendors',
            // eslint-disable-next-line no-useless-escape
            test: /[\\\/]node_modules[\\\/]/,
            priority: -10,
            chunks: 'initial'
          },
          common: {
            name: 'lazy' + '-' + 'chunk-common',
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  }
}
