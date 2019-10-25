const { resolve } = require('path')
module.exports = {
  configureWebpack: {
    entry: resolve('./src/main.js'),
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
      port: 6666
    }
  }
}
