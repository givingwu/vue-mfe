const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')

const FILE_NAME = 'vue-mfe'
const files = [FILE_NAME + '.js', FILE_NAME + '.min.js']

const srcDir = path.resolve('./dist')
const destDir = path.resolve('../../frontend/public/library')
// @ts-ignore
const version = require('../package.json').version

fs.watch(srcDir, (eventType, filename) => {
  // const stream = fs.createWriteStream(dest)
  if (eventType === 'change' && files.includes(filename)) {
    const src = [srcDir, filename].join('/')
    const dest = [
      destDir,
      /\.min/.test(filename) ? convertName(filename, version) : filename
    ].join('/')
    const copyCommand = ['cp -rf', src, dest].join(' ')

    exec(copyCommand, function(error) {
      if (error) return handleError.apply(arguments)
      replaceName()

      console.log(
        `\n[${new Date().toLocaleString()}], copy file from ${src} to ${dest} successfully!\n`
      )
    })
  }
})

const handleError = (error) => {
  if (error) {
    console.error(`执行出错: ${error}`)
    return
  }
}

/**
 * convertName
 * @param {string} str
 * @param {string} version
 */
const convertName = (str, version) => {
  return str.replace(FILE_NAME, FILE_NAME + '-' + version)
}

const html = path.resolve(destDir, '..', 'index.html')
const regexp = /(\w*\.)?vue\-mfe\-?(\d\.\d\.\d)?(\.min)?(\.js)/g

const replaceName = () => {
  const content = fs.readFileSync(html, 'utf-8')
  const modified = content.replace(regexp, function replacer(
    _,
    _start,
    _version,
    _min,
    _ext
  ) {
    let name = FILE_NAME

    if (_version) {
      name += '-' + version
    }

    if (_min) {
      if (!_version && version) {
        name += '-' + version
      }

      name += _min
    }

    if (_ext && !name.endsWith(_ext)) {
      name += _ext
    }

    return name
  })

  fs.writeFile(html, modified, (error) => {
    if (error) handleError(error)
    else {
      console.log(`Write modified content to file ${html} successfully!`)
    }
  })
}
