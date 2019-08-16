const fs = require('fs')
const camelcase = require('camelcase')
const { chalk, log } = require('@vue/cli-shared-utils')
const PLUGIN_NAME = require('../package.json').name

exports.checkExistEntries = function checkExistEntries(api, paths) {
  if (typeof paths === 'string') paths = [paths]

  let i = 0
  let l = paths.length

  while (i < l) {
    const path = api.resolve(paths[i])

    if (fs.existsSync(path)) {
      return path
    }

    i++
  }
}

exports.getPortalEntry = function getPortalEntry(api, isDev) {
  isDev = isDev || process.env.NODE_ENV === 'development'
  const mainEntry = './src/main.js'
  const portalEntry = './src/portal.entry.js'

  /* 如果启用了 master-runtime 则在开发环境使用 master-runtime 作为入口 */
  const entry = exports.checkExistEntries(api, [
    portalEntry,
    './src/router/routes.js',
    './src/routes.js',
    mainEntry
  ]) /* 否则，使用 路由 文件 */

  /* 如果是产品环境 build，且未匹配到指定的 entry 文件 */
  if (!isDev && !entry) {
    log(
      `[${PLUGIN_NAME}] we expect default entries like following ${JSON.stringify(
        entries
      )},
    also support entry customization by 'vue.config.js => entry' property but
    it must be ${chalk.bgWhite(chalk.yellow('pure'))} & ${chalk.bgWhite(
        chalk.green('no any side effects')
      )}.`
    )
  }

  return entry
}

exports.normalizeKey = function normalizeKey(args) {
  for (let key in args) {
    if (key.indexOf('-') >= 0) {
      let val = args[key]
      args[camelcase(key)] = val

      delete args[key]
    }
  }
}
