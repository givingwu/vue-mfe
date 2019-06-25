// inspired from https://github.com/zeit/next.js/blob/e98a877ee4/build/webpack/plugins/build-manifest-plugin.js
'use strict'

const { RawSource } = require('webpack-sources')
const isObject = (obj) => obj && typeof obj === 'object'

// This plugin creates a build-manifest.json for all assets that are being output
// It has a mapping of "entry" filename to real filename. Because the real filename can be hashed in production
function WebpackBuildManifest(opts = {}) {
  this.opts = Object.assign({}, this.defaultOptions, opts)
}

WebpackBuildManifest.prototype.defaultOptions = {
  filename: 'manifest.json',
  filter: (res) => res,
  appendObject: null,
}

WebpackBuildManifest.prototype.apply = function(compiler) {
  const { filename, filter, appendObject } = this.opts
  const emit = (compilation, callback) => {
    const { chunks } = compilation
    const assetMap = { js: [], css: [], img: [] }

    for (const chunk of chunks) {
      if (!chunk.name || !chunk.files) {
        continue
      }

      const files = []

      for (const file of chunk.files) {
        if (/\.map$/.test(file)) {
          continue
        }

        if (/\.hot-update\.js$/.test(file)) {
          continue
        }

        if (/\.css$/.exec(file)) {
          assetMap.css.push(file)
        }

        if (/\.(jp(e)?g|png|gif)$/.exec(file)) {
          assetMap.img.push(file)
        }

        if (/\.js(x)?$/.exec(file)) {
          assetMap.js.push(file)
        }
      }

      if (files.length > 0) {
        assetMap[chunk.name] = files
      }
    }

    if (isObject(appendObject)) {
      Object.assign(assetMap, appendObject)
    }

    compilation.assets[filename] = new RawSource(
      JSON.stringify(filter ? filter(assetMap) : assetMap)
    )

    callback()
  }

  if (compiler.hooks) {
    compiler.hooks.emit.tapAsync('emit', emit)
  } else {
    compiler.plugin('emit', emit)
  }
}

module.exports = WebpackBuildManifest
