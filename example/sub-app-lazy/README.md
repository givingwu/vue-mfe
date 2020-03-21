# lazy

The sub-application lazy.

## run

1. it depends on the `root-app` + 'vue-mfe', so when develops it needs to publish the `root-app` to npm register and install it as the dependency into sub-application's package.json.

```
cd your/project/sub-application
npm install your-root-app
```

1. if you use the vue-cli3+ or other CLI tools also need to modify the entry property to be `node_modules/root-app/src/main.js` to run with VueMfe functions. and the `vue-mfe` must be externals in sub-application's webpack configuration to avoid using multiple references of `vue-mfe`(strongly recommend you externals all the common dependencies to avoid repeat build bundle).

```
vim your/project/sub-application/vue.config.js
```

```js
const { resolve } = require('path')

module.exports = {
  configureWebpack: {
    entry: resolve(`node_modules/your-root-app-name/src/main.js`),
    externals: {
      axios: 'axios',
      vue: 'Vue',
      vuex: 'Vuex',
      'vue-router': 'VueRouter',
      'vue-mfe': 'VueMfe',
      'vue-types': 'VueTypes'
    },
    devServer: {
      // https://webpack.docschina.org/configuration/dev-server/#devserver-contentbase
      // https://github.com/vuejs/vue-cli/blob/fba2ad0606ce42eb4ac776ec4b528bf51ab20899/packages/%40vue/cli-service/lib/commands/serve.js#L170
      contentBase: resolve('node_modules/your-root-app-name/public')
    },
    // webpack-chain https://github.com/neutrinojs/webpack-chain
    // vue-cli https://cli.vuejs.org/zh/guide/webpack.html#%E9%93%BE%E5%BC%8F%E6%93%8D%E4%BD%9C-%E9%AB%98%E7%BA%A7
    chainWebpack: (config) => {
      // https://cli.vuejs.org/zh/guide/webpack.html#%E4%BF%AE%E6%94%B9%E6%8F%92%E4%BB%B6%E9%80%89%E9%A1%B9
      config.plugin('html').tap((args) => {
        args[0].template = resolve(
          `node_modules/your-root-app-name/public/index.html`
        )

        return args
      })
    }
  }
}
```

## build

1. when build production env, set the webpack entry as `src/main.js` in `vue.config.js`.

```js
const { resolve } = require('path')

module.exports = {
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
```

```
vue-cli-service build
```

2. build it to umd module format to be lazily loadable for Instant Prototyping.

```bash
❯ /usr/local/bin/vue-cli-service build --target lib --name lazy --entry main.js
```

## deploy

1. upload them to your CDN
2. then change the root-app `resources` config like that:

```js
createApp({
  router,
  resources: () => ({
    demo: [
      'https://your.cdn/demo/main.hash.css',
      'https://your.cdn/demo/demo.umd.js'
    ], // load from local
    lazy: [
      'https://your.cdn/lazy/chunk-vendors.hash.js',
      'https://your.cdn/lazy/lazy.unmd.js'
    ] // load from remote
  })
})
```
