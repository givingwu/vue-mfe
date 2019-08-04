/**
 * inspired from:
 * 1. https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli-service/lib/commands/build/index.js
 * */
'use strict'
const webpack = require('webpack')
const path = require('path')
const rimraf = require('rimraf')
const formatStats = require('@vue/cli-service/lib/commands/build/formatStats')

const defaults = {
  clean: true,
  target: 'lib',
  formats: 'commonjs,umd,umd-min',
  'unsafe-inline': true,
}

const buildModes = {
  lib: 'library',
  wc: 'web component',
  'wc-async': 'web component (async)',
}

module.exports = async function build(args, api, options) {
  const {
    chalk,
    log,
    done,
    info,
    logWithSpinner,
    stopSpinner,
  } = require('@vue/cli-shared-utils')

  for (const key in defaults) {
    if (args[key] == null) {
      args[key] = defaults[key]
    }
  }

  log()
  const mode = api.service.mode
  const targetDir = api.resolve(args.dest || args.output || options.outputDir)

  if (args.target === 'app') {
    const bundleTag = args.modern
      ? args.modernBuild
        ? `modern bundle `
        : `legacy bundle `
      : ``
    logWithSpinner(`Building ${bundleTag}for ${mode}...`)
  } else {
    const buildMode = buildModes[args.target]

    if (buildMode) {
      const additionalParams =
        buildMode === 'library' ? ` (${args.formats})` : ``
      logWithSpinner(
        `Building for ${mode} as ${buildMode}${additionalParams}...`
      )
    } else {
      throw new Error(`Unknown build target: ${args.target}`)
    }
  }

  return new Promise((resolve, reject) => {
    rimraf(targetDir, (error) => {
      if (error) return reject('Rimraf failed: ' + dest + ' => ' + error)
      else {
        webpack(api.resolveWebpackConfig(), (err, stats) => {
          stopSpinner(false)

          if (err) {
            return reject(err)
          }

          if (stats.hasErrors()) {
            return reject(`Build failed with errors.`)
          }

          if (!args.silent) {
            const targetDirShort = path.relative(api.service.context, targetDir)
            log(formatStats(stats, targetDirShort, api))

            if (args.target === 'app' && !isLegacyBuild) {
              if (!args.watch) {
                done(
                  `Build complete. The ${chalk.cyan(
                    targetDirShort
                  )} directory is ready to be deployed.`
                )
                info(
                  `Check out deployment instructions at ${chalk.cyan(
                    `https://cli.vuejs.org/guide/deployment.html`
                  )}\n`
                )
              } else {
                done(`Build complete. Watching for changes...`)
              }
            }
          }

          // test-only signal
          if (process.env.VUE_CLI_TEST) {
            console.log('Build complete.')
          }

          resolve()
        })
      }
    })
  })
}
