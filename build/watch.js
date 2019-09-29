const fs = require('fs')
const { exec } = require('child_process')

const FILE_NAME = 'vue-mfe'
const files = [FILE_NAME + '.js', FILE_NAME + '.min.js']

const srcDir =
  '/Users/vuchan.c.wu/Development/MicroFrontEnd/ibuild-portal-lte/ibuild-mfe-portal/packages/vue-mfe/dist'
const destDir =
  '/Users/vuchan.c.wu/Development/MicroFrontEnd/ibuild-portal-lte/ibuild-mfe-portal/frontend/public/library/'

fs.watch(srcDir, (eventType, filename) => {
  // const stream = fs.createWriteStream(dest)
  if (eventType === 'change' && files.includes(filename)) {
    const src = [srcDir, filename].join('/')
    const dest = [destDir, filename].join('/')

    const copyCommand = ['cp -rf', src, dest].join(' ')

    exec(copyCommand, function() {
      handleError.apply(arguments)

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
