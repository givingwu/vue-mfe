const path = require('path')
const webpack = require('webpack')
const HTMLWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: {
    main: path.resolve('./src/main.js')
  },
  mode: process.env.NODE_ENV || 'development',
  devtool: 'cheap-module-eval-source-map',
  context: __dirname,

  output: {
    path: path.resolve('dist'),
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    // publicPath: '',
    globalObject: 'this',
  },

  externals: {
    'vue': 'Vue',
    'vue-router': 'VueRouter',
  },

  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    historyApiFallback: true,
    port: 8000,
    hot: true,
    open: true,
    overlay: {
      warnings: true,
      errors: true
    }
  },

  resolve: {
    alias: {
      vue: 'vue/dist/vue.esm.js',
      'vue-mfe': path.join(__dirname, '../../../src')
    }
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader']
      }
    ]
  },

  optimization: {
    splitChunks: {
      cacheGroups: {
        shared: {
          name: 'chunk-common',
          chunks: 'initial',
          minChunks: 2
        }
      }
    }
  },

  plugins: [
    new webpack.DefinePlugin(
      {
        'process.env': {
          NODE_ENV: '"development"',
          BASE_URL: '"/"'
        }
      }
    ),
    new HTMLWebpackPlugin({
      template: path.join(__dirname, './public/index.html'),
      chunks: 'main'
    })
  ]
}
