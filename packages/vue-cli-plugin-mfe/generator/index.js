/**
 * # Generator
 * https://cli.vuejs.org/dev-guide/plugin-dev.html#generator
 * [Generator API Source Code](https://github.com/vuejs/vue-cli/blob/dev/packages/%40vue/cli/lib/GeneratorAPI.js)
 *
 * + #entry It will be invoked in two possible scenarios:
 *  1. During a project's initial creation, if the CLI plugin is installed as part of the project creation preset.
 *  2. When the plugin is installed after project's creation and invoked individually via vue add or `vue invoke`.
 *
 * + #usage
 *  1. see [creating new templates、files or edit existing ones](https://cli.vuejs.org/dev-guide/plugin-dev.html#creating-new-templates)
 *  2. see [filename edge cases](https://cli.vuejs.org/dev-guide/plugin-dev.html#filename-edge-cases)
 *  3. see [extending package](https://cli.vuejs.org/dev-guide/plugin-dev.html#extending-package)
 *  4. see [changing main file](https://cli.vuejs.org/dev-guide/plugin-dev.html#changing-main-file)
 *
 * + #params A generator should export a function which receives three arguments:
 *  1. A [Generator API](https://cli.vuejs.org/dev-guide/generator-api.html#generator-api) instance;
 *  2. The generator options for this plugin.
 *   2.1 These options are resolved during the prompt phase of project creation,
 *   2.2 or loaded from a saved preset in [~/.vuerc](~/.vuerc).
 */

module.exports = (api /* see #params.1 */, options /* see #params.2 */) => {
  const {
    useMasterRuntime,
    masterRuntimeName,
    masterRuntimeVersion,
    domainRoutePrefix,
  } = options

  api.extendPackage({
    scripts: {
      package: 'vue-cli-service package',
      start: 'npm run serve',
      dev: 'npm run serve',
    },
    devDependencies: {
      '@vue/eslint-config-prettier': '^4.0.1',
      '@vue/eslint-config-standard': '^4.0.0',
    },
  })

  /* see #usage.1 [creating new templates] */
  /* see #usage.2 [filename edge cases] */
  if (useMasterRuntime) {
    api.render('./template', {
      masterRuntimeName,
      domainRoutePrefix,
    })

    // https://cli.vuejs.org/dev-guide/plugin-dev.html#service-plugin
    // An object containing project local options specified in vue.config.js, or in the "vue" field in package.json.
    api.extendPackage({
      dependencies: {
        [masterRuntimeName]: masterRuntimeVersion,
      },
      'portal-config': {
        useMasterRuntime,
        masterRuntimeName,
        masterRuntimeVersion,
        domainRoutePrefix,
      },
    })

    api.onCreateComplete(() => {
      const fs = require('fs')
      const entryJSFile = api.resolve('src/main.js')
      if (fs.existsSync(entryJSFile)) {
        fs.unlinkSync(entryJSFile)
      }

      const appVueFile = api.resolve('src/App.vue')
      if (fs.existsSync(appVueFile)) {
        fs.unlinkSync(appVueFile)
      }
    })
  }
}
