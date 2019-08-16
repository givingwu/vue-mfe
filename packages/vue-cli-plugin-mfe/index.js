/**
 * # Service
 * https://cli.vuejs.org/dev-guide/plugin-dev.html#service-plugin
 * [Service API Source Code](https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/PluginAPI.js)
 *
 * + # entry
 *  1. Service plugins are loaded automatically when a Service instance is created.
 *
 * + #usage
 *  1. see [Modifying webpack config](https://cli.vuejs.org/dev-guide/plugin-dev.html#modifying-webpack-config)
 *  2. see [Add a new cli-service command](https://cli.vuejs.org/dev-guide/plugin-dev.html#add-a-new-cli-service-command)
 *  3. see [Modifying existing cli-service command](https://cli.vuejs.org/dev-guide/plugin-dev.html#modifying-existing-cli-service-command)
 *  4. see [Specifying Mode for Commands](https://cli.vuejs.org/dev-guide/plugin-dev.html#specifying-mode-for-commands)
 *
 * + #params
 *  1. A [PluginAPI](https://cli.vuejs.org/dev-guide/plugin-api.html#plugin-api) instance
 *  2. An object containing project local options specified in `vue.config.js`, or in the `vue` field in package.json.
 */

const path = require('path')
const camelcase = require('camelcase')
const { chalk, stopSpinner, log } = require('@vue/cli-shared-utils')
const WebpackRequireFrom = require('webpack-require-from')
const { getPortalEntry, normalizeKey } = require('./helpers/index')
const WebpackManifest = require('./plugins/webpack-manifest-plugin')
const WebpackArchiver = require('./plugins/webpack-archiver-plugin')
const buildCMD = require('./commands/build')
const uploadCMD = require('./commands/upload')

/**
 * https://cli.vuejs.org/zh/dev-guide/plugin-dev.html#service-%E6%8F%92%E4%BB%B6
 */
module.exports = (api /* see #params.1 */, options /* see #params.2 */) => {
  const cwd = api.getCwd()
  const packageJSON = require(api.resolve('./package.json'))
  const PORTAL_CONFIG = packageJSON['portal-config']
  const {
    useMasterRuntime,
    masterRuntimeName,
    domainRoutePrefix
  } = PORTAL_CONFIG

  const PACKAGE_VERSION = packageJSON.version
  const PACKAGE_NAME = domainRoutePrefix || packageJSON.name
  const moduleName = packageJSON.moduleName

  if (!moduleName) {
    throw new Error(
      '自 vue-cli-plugin-mfe@1.1.0 起要求在当前项目的 package.json 中写入新字段 `{ moduleName: "项目中文名称" }` 以使 LTE 能更友好的提示用户更新该应用'
    )
  }

  const masterRuntimeModule =
    useMasterRuntime && api.resolve(`./node_modules/${masterRuntimeName}`)
  // const webpackConfig = api.resolveWebpackConfig()

  /* see #usage.1 Modifying webpack config */
  // api.configureWebpack({ webpackConfig })
  if (useMasterRuntime) {
    /* prepend the master-runtime modules for current portal project  */
    const masterRuntimePath = api.resolve(`${masterRuntimeModule}/node_modules`)

    /* see #usage.1 Modifying webpack config */
    api.configureWebpack((config) => {
      config.resolveLoader.modules.push(masterRuntimePath)
      config.resolve.modules.push(masterRuntimePath)
    })
  }

  const defaults = {
    uploadUrl:
      process.env.PUBLISH_HOST ||
      'http://192.168.1.2:3010/api/mfe/fileupload/uploadTar',
    downloadUrl:
      process.env.DOWNLOAD_HOST ||
      'http://192.168.1.2:3010/api/mfe/download/resources/',
    name: PACKAGE_NAME,
    output: 'package',
    upload: true,
    json: true,
    disableSourceMap: false,
    disableConsole: false
  }

  /* see #usage.2 Add a new cli-service command */
  api.registerCommand(
    'package',
    {
      description: 'Package to .tgr.gz and upload to server',
      usage: 'vue-cli-service package [options]',
      options: {
        '--upload-url':
          'specify package-server API url to upload bundled files',
        '--download-url':
          'specify package-server API url to download static files',
        '--disable-source-map': 'disable source map. default: false',
        '--output-path': `specify the output path of bundled files? default: package => ${cwd}/package`,
        '--disable-console-log': `disable all 'console' & 'debugger' in source code when PROD env. default: false`
      }
    },
    async (args) => {
      normalizeKey(args)

      for (let key in defaults) {
        key = camelcase(key)

        if (args[key] == null) {
          args[key] = defaults[key]
        }
      }

      if (args.downloadUrl && args.downloadUrl.slice(-1) !== '/') {
        args.downloadUrl += '/'
      }

      const packageName = args.name
      const camelizedName = camelcase(packageName)
      const ts = Date.now()

      const packageData = {
        ts,
        host: args.uploadUrl,
        name: packageName,
        version: PACKAGE_VERSION
      }
      const nameWithVer = packageName + '@' + PACKAGE_VERSION + '-' + ts
      const outputPath = api.resolve(
        path.join(args.output, nameWithVer + '.tar')
      )

      /* see #usage.1 Modifying webpack config */
      /* we do not need *.html, *.ico and those feature as following */
      api.chainWebpack((config) => {
        config.plugins
          .delete('html') // for cli-3.2+
          .delete('html-index') // for cli-3.5+
          .delete('prefetch')
          .delete('prefetch-index')
          .delete('preload')
          .delete('preload-index')
          .delete('workbox')
          .delete('workbox-index')
          .delete('copy')
          .delete('pwa')
          .end()
      })

      /* see #usage.1 Modifying webpack config */
      api.configureWebpack({
        entry: getPortalEntry(api, false) || options.entry, // options.entry
        devtool: args.disableSourceMap ? false : 'source-map', // disable all
        output: {
          path: api.resolve(args.output),
          library: {
            root: '__domain__app__' + camelizedName,
            amd: packageName,
            commonjs: packageName
          },
          libraryTarget: 'umd',
          filename: 'js/' + camelizedName + '-[chunkhash:8].umd.js',
          // libraryExport: name,
          chunkLoadTimeout: 120000,
          crossOriginLoading: 'anonymous'
        },
        optimization: {
          splitChunks: {
            cacheGroups: {
              vendors: {
                name: camelizedName + '-' + 'chunk-vendors',
                // eslint-disable-next-line no-useless-escape
                test: /[\\\/]node_modules[\\\/]/,
                priority: -10,
                chunks: 'initial'
              },
              common: {
                name: camelizedName + '-' + 'chunk-common',
                minChunks: 2,
                priority: -20,
                chunks: 'initial',
                reuseExistingChunk: true
              }
            }
          }
        },
        plugins: [
          args.downloadUrl &&
            new WebpackRequireFrom({
              path: args.downloadUrl + args.name + '/'
            }),
          new WebpackManifest({
            appendObject: packageData
          }),
          new WebpackArchiver({
            source: api.resolve(args.output),
            destination: outputPath,
            format: 'tar'
          })
        ].filter(Boolean)
      })

      /*
       * https://github.com/terser-js/terser#minify-options
       * https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/config/terserOptions.js
       */
      api.configureWebpack((config) => {
        if (
          process.env.NODE_ENV === 'production' &&
          args.disableConsoleLog &&
          !process.env.VUE_CLI_TEST // https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/config/prod.js#L17
        ) {
          const terser =
            config.optimization.minimizer && config.optimization.minimizer[0]

          terser &&
            (terser.options.terserOptions.compress = {
              ...terser.options.terserOptions.compress,
              drop_console: args.disableConsoleLog,
              drop_debugger: args.disableConsoleLog
            })
        }
      })

      /* const cfg = api.resolveWebpackConfig()
      log('webpack externals: ', JSON.stringify(cfg.externals)) */

      try {
        log()
        log('build resource...')
        log()
        await buildCMD(args, api, options)

        log()
        log('upload files...')
        log()
        await uploadCMD(args, outputPath, moduleName)
      } catch (err) {
        stopSpinner(false)
        log(chalk.red(err))

        throw err
      }
    }
  )
}

/* see #usage.4 Specifying Mode for Commands */
module.exports.defaultModes = {
  package: 'production'
}
