import routes from './router/routes'

<%_ if (masterRuntimeName) { _%>
console.log(`U r running current app from ./node_modules/<%= masterRuntimeName %>/src/main.js entry.`)
<%_ } else { _%>
  console.log(`U r running current app from './src/main.js'.`)
<%_ } _%>

export default routes
