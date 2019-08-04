/**
 * # Prompts
 * https://cli.vuejs.org/dev-guide/plugin-dev.html#prompts
 */
const { chalk } = require('@vue/cli-shared-utils')

module.exports = function(pkg) {
  const prompts = [
    {
      name: 'useMasterRuntime',
      type: 'confirm',
      message: 'Use master-runtime or not?',
      default: true,
    },
    {
      name: 'masterRuntimeName',
      type: 'list',
      when: (answers) => answers.useMasterRuntime,
      message: 'Which one?',
      choices: [
        {
          name: 'Choose ' + chalk.yellow('ibuild-portal-lte'),
          value: 'ibuild-portal-lte',
          short: 'iBuild',
        },
        {
          name: 'Choose ' + chalk.yellow('mro-portal-lte'),
          value: 'mro-portal-lte',
          short: 'MRO',
        },
        {
          name: 'no any one, i wanna input its name',
          value: 'custom',
          short: 'Custom',
        },
      ],
      default: 'ibuild-portal-lte',
    },
    {
      name: 'masterRuntimeName',
      type: 'input',
      when: (answers) => answers.masterRuntimeName === 'custom',
      message: 'Input master-runtime name',
    },
    {
      name: 'masterRuntimeVersion',
      type: 'input',
      when: (answers) => answers.masterRuntimeName,
      message: 'Input master-runtime version',
      default: '^1.0.19',
    },
    {
      name: 'domainRoutePrefix',
      type: 'input',
      message: 'Input route namespace prefix',
      default: pkg ? pkg.name : '/domain',
    },
  ]

  return prompts
}
