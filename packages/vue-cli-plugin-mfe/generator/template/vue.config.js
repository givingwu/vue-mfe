/**
 * Vue-CLI
 * Github Source-Code
 *  1. 加载入口
 *    https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/Service.js#L72
 *  2. 加载规则
 *    https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/Service.js#L274
 *  3. 配置规则
 *    https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/options.js#L3
 *  4. 默认配置
 *    https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/options.js#L62
 *
 * `vue.config.js` Configuration Document:
 *    https://cli.vuejs.org/zh/guide/webpack.html
 *
 * Configuration Options List:
 *    https://cli.vuejs.org/zh/config/#%E5%85%A8%E5%B1%80-cli-%E9%85%8D%E7%BD%AE
 */

/**
 * 1. vue-cli 3 搭建的项目中路径相关问题
 *    https://segmentfault.com/a/1190000016120011
 * 2. vue-cli 3.0 特性速读
 *    https://juejin.im/post/5ad862c95188252eb3237752
 * 3. vue-loader 整合注意事项
 *    https://github.com/vuejs/vue-loader/blob/master/docs/zh/migrating.md
 */
const { resolve } = require('path')
const webpack = require('webpack')
const isDev = process.env.NODE_ENV === 'development'
const proxiesConfig = require('./proxy.config')
const externalsConfig = require('./external.config')

module.exports = {
  configureWebpack: {
  <%_ if (masterRuntimeName) { _%>
    entry: resolve(`node_modules/<%= masterRuntimeName %>/src/main.js`),
  <%_ } _%>
    // 仅仅 external 被公用的内容
    externals: externalsConfig,
    resolve: {
      // Set up all the aliases we use in our app.
        // https://medium.com/@justintulk/solve-module-import-aliasing-for-webpack-jest-and-vscode-74007ce4adc9
      alias: require('./aliases.config').webpack,
    },
    devServer: {
      open: true, // process.platform === 'darwin',
      port: 5000,
      proxy: proxiesConfig,
    },
    plugins: [
      !isDev &&
        new webpack.BannerPlugin({
          banner: `All Copyright Reserved\n (c) ${new Date().getFullYear()} www.yzw.cn`,
          entryOnly: true,
        }),
    ].filter(Boolean),
  },
  // webpack-chain https://github.com/neutrinojs/webpack-chain
  // vue-cli https://cli.vuejs.org/zh/guide/webpack.html#%E9%93%BE%E5%BC%8F%E6%93%8D%E4%BD%9C-%E9%AB%98%E7%BA%A7
  chainWebpack: (config) => {
    config.module
      .rule('cur|ani')
      .test(/\.(cur|ani)$/)
      .use('file')
      .loader('file-loader')
      .options({
        name: 'cursors/[name].[ext]?[hash]',
        publicPath: '/dist/',
      })
  },
}
