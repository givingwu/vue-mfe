/**
 * inspired from:
 * 1. https://github.com/autochthe/webpack-archive-plugin
 * 2. https://github.com/archiverjs/node-archiver
 * */
'use strict'

const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const { log } = require('@vue/cli-shared-utils')

function WebpackArchiver(options) {
  if (typeof options === 'string') {
    options = { name: options }
  }

  this.options = Object.assign({}, this.defaultOptions, options)
}

WebpackArchiver.prototype.defaultOptions = {
  name: 'app' + '-' + Date.now(), // string
  ext: '.tar' // .tar || .zip || Array<['.tar', '.zip']>
}

WebpackArchiver.prototype.apply = function(compiler) {
  const { onSuccess, onError, destination } = this.options

  const afterEmit = (compilation, cb) => {
    this.fileHash = compilation.hash

    // Set output location
    this.execute()
      .then(() => {
        // log(`${destination} existsSync: `, fs.existsSync(destination))
        onSuccess && onSuccess()
        cb()
      })
      .catch((err) => {
        compilation.errors.push(err)
        onError && onError(err)
        log('err:', err)
      })
  }

  if (compiler.hooks) {
    compiler.hooks.afterEmit.tapAsync('afterEmit', afterEmit)
  } else {
    compiler.plugin('after-emit', afterEmit)
  }
}

WebpackArchiver.prototype.execute = function() {
  const command = this.options

  // Create archive streams
  return new Promise(function(resolve, reject) {
    if (!command.source || !command.destination) {
      if (command.verbose) {
        log(
          'Warning - Archive parameters must be formatted as follows: { source: <string>, destination: <string> }'
        )
      }
      reject()
    }

    var fileRegex = /(\*|\{+|\}+)/g
    var matches = fileRegex.exec(command.source)

    var isGlob = matches !== null

    fs.lstat(command.source, function(sErr, sStats) {
      if (sErr) reject(sErr)

      var output = fs.createWriteStream(command.destination)
      var archive = archiver(command.format, command.options)

      archive.on('error', function(err) {
        // log('archive error')
        reject(err)
      })

      archive.on('warning', function(err) {
        // log('archive warning')
        reject(err)
      })

      archive.on('finish', function() {
        // log('archive finish')
      })

      archive.on('end', function() {
        // log('archive end')
      })

      archive.pipe(output)

      // Exclude destination file from archive
      const destFile = path.basename(command.destination)

      const globOptions = Object.assign(
        { ignore: destFile },
        command.globOptions || {}
      )

      if (isGlob) {
        archive.glob(command.source, globOptions)
      } else if (sStats.isFile()) {
        archive.file(command.source, {
          name: path.basename(command.source)
        })
      } else if (sStats.isDirectory()) {
        archive.glob('**/*', {
          cwd: command.source,
          ignore: destFile
        })
      }

      archive.finalize().then(function() {
        log('archive.finalize()')
        output.end()
        resolve()
      })
    })
  })
}

WebpackArchiver.prototype.getExtension = function(options) {
  let zip = false
  let tar = false

  if (options.ext) {
    if (typeof options.ext === 'string') {
      zip = options.ext === '.zip' && '.zip'
      tar = (options.ext === '.tar' || options.ext === '.tar.gz') && options.ext
    } else if (Array.isArray(options.ext)) {
      zip = options.ext.indexOf('.zip') != -1 && '.zip'
      tar =
        (options.ext.indexOf('.tar') != -1 ||
          options.ext.indexOf('.tar.gz') != -1) &&
        '.tar.gz'
    }
  }

  return { zip, tar }
}

module.exports = WebpackArchiver
