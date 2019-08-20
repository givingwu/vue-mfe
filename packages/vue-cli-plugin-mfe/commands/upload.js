// @ts-nocheck
'use strict'

const fs = require('fs')
const request = require('request')
const {
  chalk,
  log,
  done,
  info,
  logWithSpinner,
  stopSpinner
} = require('@vue/cli-shared-utils')

module.exports = async function(args, filePath, moduleName) {
  const name = args.name
  const url = args.uploadUrl
  const download = args.downloadUrl || args.uploadUrl
  const fileSize = fs.statSync(filePath).size

  log()
  log(
    JSON.stringify({
      name,
      moduleName,
      uploadUrl: url,
      downloadUrl: download,
      file: filePath,
      fileSize
    })
  )
  log()

  return new Promise((resolve, reject) => {
    logWithSpinner(`start uploading ${name} to package-server ${url}...`)

    // https://github.com/form-data/form-data/issues/250
    // https://github.com/form-data/form-data/issues/336#issuecomment-301252706
    /* const formData = new FormData({})
    formData.append('file', fs.createReadStream(file), {
      // headers: { 'transfer-encoding': 'chunked' },
      filepath: file,
      knownLength: fileSize,
    } */

    return request
      .post({
        url,
        formData: {
          file: fs.createReadStream(filePath),
          moduleName
        }
      })
      .on('error', (error) => {
        stopSpinner(false)
        log(chalk.red(`Upload module ${chalk.cyan(name)} failed`))
        log(chalk.red(error))

        reject(error)
      })
      .on('complete', (res, body) => {
        stopSpinner(false)

        if (res.statusCode !== 200) {
          log(chalk.red(`Upload module ${chalk.cyan(name)} failed`))
          log(
            chalk.red(
              `Remote server ${url} status error. Code: ${chalk.red(
                res.statusCode
              )}, Body: ${chalk.red(JSON.stringify(body))}`
            )
          )

          reject(body)
        } else {
          done(`Upload module ${chalk.yellow(name)} complete.`)
          info(`Checkout it out on package-server ${chalk.cyan(`${download}`)}`)

          resolve(res.resume())
        }
      })
  })
}
