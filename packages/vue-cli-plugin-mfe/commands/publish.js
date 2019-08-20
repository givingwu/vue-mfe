// @ts-nocheck
'use strict'

const qs = require('qs')
const request = require('request')
const {
  chalk,
  log,
  done,
  info,
  logWithSpinner,
  stopSpinner,
} = require('@vue/cli-shared-utils')

module.exports = async function(args) {
  const name = args.name
  const publishUrl = args.publishUrl
  const [url, ...querystring] = publishUrl.split('?')
  let data = qs.parse(querystring)

  if (!data || !data.moduleCode || typeof data.moduleCode !== 'string') {
    if (typeof data === 'object') {
      data = {
        ...data,
        moduleCode: name,
      }
    } else {
      data = { moduleCode: name }
    }
  }

  return new Promise((resolve, reject) => {
    logWithSpinner(`start publishing app ${name}...`)

    return request
      .get({
        url,
        data,
      })
      .on('error', (error) => {
        stopSpinner(false)
        log(chalk.red(`Publish module ${chalk.cyan(name)} failed`))
        log(chalk.red(error))

        reject(error)
      })
      .on('complete', (res, body) => {
        stopSpinner(false)

        if (res.statusCode !== 200) {
          log(chalk.red(`Publish module ${chalk.cyan(name)} failed`))
          log(
            chalk.red(
              `Remote server ${url} status error. Code: ${chalk.red(
                res.statusCode
              )}, Body: ${chalk.red(JSON.stringify(body))}`
            )
          )

          reject(body)
        } else {
          done(`Publish module ${chalk.yellow(name)} complete.`)
          info('Hey, Congratulations!')

          resolve(res.resume())
        }
      })
  })
}
