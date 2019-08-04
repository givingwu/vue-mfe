'use strict'

const fs = require('fs')
const FormData = require('form-data')
const {
  chalk,
  log,
  done,
  info,
  logWithSpinner,
  stopSpinner
} = require('@vue/cli-shared-utils')

module.exports = async function(args, file) {
  const name = args.name
  const url = args.uploadUrl
  const download = args.downloadUrl || args.uploadUrl
  const fileSize = fs.statSync(file).size

  log()
  log(
    JSON.stringify({
      name,
      uploadUrl: url,
      downloadUrl: download,
      file,
      fileSize
    })
  )
  log()

  return new Promise((resolve, reject) => {
    logWithSpinner(`start uploading ${name} to package-server ${url}...`)

    const formData = new FormData({})

    formData.append('file', fs.createReadStream(file), {
      headers: { 'transfer-encoding': 'chunked' },
      knownLength: fileSize
    })

    formData.submit(url, (err, res) => {
      stopSpinner(false)

      if (err) {
        log(chalk.red(`Publish module ${chalk.cyan(name)} failed`))
        log(chalk.red(err))
        reject(err)

        process.exit(1)
      } else if (res.statusCode !== 200) {
        log(chalk.red(`Publish module ${chalk.cyan(name)} failed`))
        log(
          chalk.red(
            `Remote server ${url} Status error. Code: ${chalk.red(
              res.statusCode
            )}, Body: ${chalk.red(res.statusMessage)}`
          )
        )

        process.exit(1)
      } else {
        done(`Upload module ${chalk.yellow(name)} complete.`)
        info(`Checkout it out on package-server ${chalk.cyan(`${download}`)}`)

        resolve(res.resume())
      }
    })
  })
}
