const path = require('path')
const fs = require('fs')
const prettier = require('prettier')

const aliases = {
  // '@': 'src' /* local src file */,
  <%_ if (masterRuntimeName) { _%>
    '@@': 'node_modules/<%= masterRuntimeName %>/src' /* master-runtime bundle module */,
    '@root': '.', // 项目级的别名
  <%_ } _%>
}

module.exports = {
  webpack: {},
  jest: {},
  jsconfig: {},
}

for (const alias in aliases) {
  const aliasTo = aliases[alias]
  module.exports.webpack[alias] = resolveSrc(aliasTo)
  const aliasHasExtension = /\.\w+$/.test(aliasTo)
  module.exports.jest[`^${alias}$`] = aliasHasExtension
    ? `<rootDir>/${aliasTo}`
    : `<rootDir>/${aliasTo}/index.js`
  module.exports.jest[`^${alias}/(.*)$`] = `<rootDir>/${aliasTo}/$1`
  module.exports.jsconfig[alias + '/*'] = [aliasTo + '/*']
  module.exports.jsconfig[alias] = aliasTo.includes('/index.')
    ? [aliasTo]
    : [
        aliasTo + '/index.js',
        aliasTo + '/index.json',
        aliasTo + '/index.vue',
        aliasTo + '/index.scss',
        aliasTo + '/index.css',
      ]
}

const jsconfigTemplate = require('./jsconfig.template') || {}
const jsconfigPath = path.resolve(__dirname, 'jsconfig.json')

fs.writeFile(
  jsconfigPath,
  prettier.format(
    JSON.stringify(
      Object.assign(
        jsconfigTemplate,
        {
          compilerOptions: Object.assign(jsconfigTemplate.compilerOptions || {}, {
            paths: module.exports.jsconfig,
        })
        }
      )
      /* {
        ...jsconfigTemplate,
        compilerOptions: { ...(jsconfigTemplate.compilerOptions || {}), paths: module.exports.jsconfig },
      } */
    ),
    Object.assign(require('./.prettierrc.js'), { parser: 'json', })
  ),
  (error) => {
    if (error) {
      console.error(
        'Error while creating jsconfig.json from aliases.config.js.'
      )
      throw error
    }
  }
)

function resolveSrc(_path) {
  return path.resolve(__dirname, _path)
}
