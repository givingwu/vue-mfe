<p align="center"><a href="https://vuchan.github.io/vue-mfe" target="_blank" rel="noopener noreferrer"><img width="200" src="./docs/.vuepress/public/images/mfe-logo.png" alt="VueMfe logo"></a></p>

<p align="center">
  <a href="https://npmcharts.com/compare/vue-mfe?minimal=true"><img src="https://img.shields.io/npm/dm/vue-mfe.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/vue-mfe"><img src="https://img.shields.io/npm/v/vue-mfe.svg" alt="Version"></a>
  <a href="https://github.com/996icu/996.ICU/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-Anti%20996-blue.svg" alt="License"></a>
  <br>
</p>



# VueMfe

✨😊 A micro-frontend solution based on Vue.js. [中文](./README-zh_CN.md) | [DEMO](https://vuchan.github.io/vue-mfe)

```bash
___________
| | |__ |__
| | |   |__
```


## FEATURES
+ Support dynamically add child routes to an existing route & nested route.
+ Support dynamically load sub-application & nested sub-application.
+ Support lazy load module or component from remote.
+ Support sub-application independently develop & build(need mfe plugin supports).


## How

The micro-frontend principle implemented by Vue-MFE is based on the pedestal (App). When the pedestal project intercepts the route without matching, it will try to dynamically load the sub-application (SubApp) routes. And after the sub-application routes is successfully injected into the pedestal's routing instance `this.$router`, `next(to)` thus achieves a complete closed loop.


<p align="center">
  <img alt="vue-mfe base info" src="docs/.vuepress/public/images/vue-mfe-base.jpeg" width="600" height="400">
</p>


## DEMO
```bash
npm install
npm run example
```


## USAGE

### Step 1

Create the VueMfe pedestal(root) application, because we need to register the `beforeHook` hook of the `router` instance, so the `router` parameter is required.

```js
import router from '@@/router/index'
import { createApp } from 'vue-mfe'

export default createApp({
  router
})
```


### Step 2

Create VueMfe sub-application, you can create arbitrary amount of them but must take care of that each prefix cannot be duplicated.

```js
import routes from './router/routes.js'
import { createSubApp } from 'vue-mfe'

export default createSubApp({
  prefix: '/demo',
  routes,
  name: '示例',
  // resources will be installed and executed sequentially
  resources: []
})
```


## API

+ `VueMfe.createApp({}: AppConfig)` create the root(pedestal) application [source code](./src/index.js#L42)

```js
import { createApp } from 'vue-mfe'

/**
 * createApp
 * @typedef AppConfig
 * @property {Router} router required, the router instance of the root(pedestal) app
 * @property {boolean} [sensitive] optional, default is `false`，is the path sensitive or not for word case? '/AuTh/uSEr' => '/auth/user'
 * @property {string} [parentPath] optional，default is `'/'`, where the dynamically routes be injected?
 * @property {Resources} [resources] optional, the resources support async/async function or object. them will be installed and executed sequentially and SubAppConfig.resources > AppConfig.resources
 * @typedef {Object<string, {}>|Object<string, string[]>|Object<string, {}[]>} RawResource
 * @typedef {RawResource & AppConfig & SubAppConfig} Resource
 *
 * @callback ResourcesFn
 * @returns {Resource|Resource[]|Promise<Resource>}
 * @typedef {ResourcesFn|Resource|Resource[]} Resources
 *
 * @param {AppConfig} config
 *
 * 1. initialize router and register the root application with its config
 * 2. register the before hook to intercepts the unmatchable route
 * 3. lazy load the resources of the unmatchable route if it has
 */
export default createApp({
  router,
  sensitive: false,
  parentPath: '/',
  resources: () => {},
})
```


+ `VueMfe.createSubApp({}: SubAppConfig)` create a sub-application [source code](./src/index.js#L85)

```js
import { createSubApp } from 'vue-mfe'

/**
 * createSubApp
 * @typedef {Object} SubAppConfig
 * @property {string} prefix required, sup-application route prefix that needs to be intercepted
 * @property {Route[]} routes required, sup-application routes config array that needs to be dynamically injected
 * @property {string} [name] optional, sup-application name string not prefix
 * @property {(rootApp: Vue)=>boolean|Error|Promise<boolean|Error>} [init] sup-application initialize method, it receive the root app instance as the first parameter
 * @property {string} [parentPath] optional, where the sup-application routes be dynamically injected to?
 * @property {Resources} [resources] optional, an object or a function it given the resources of current application
 * @property {string} [globalVar] optional，if the resource given a global variable key
 * @property {Object<string, (() => Promise<{}>)|{}>} [components] optional, the components that need to be exposed
 * @property {[props: string]: any} [props] the other properties be register or shared as what you want
 *
 * @param {SubAppConfig} config
 *
 * 1. when install a sub-application calls `createSubApp(this.$router.app)`
 * 2. register current application configuration to inner `configMap`
 * 3. call the `init(app) => void|boolean` method to initialize the pre-dependencies
 * 4. dynamically install the routes to the specific parent path
 * 5. next(to), END
 */
export default createSubApp({
  prefix: '/demo',
  routes,
  name: 'example demo',
  parentPath: '/',
  // the css needs to be install as first, then the chunk-vendors, last the umd.js
  resources: ['main.xxxxxxx.css', 'chunk.xxxx.vendors.js', 'demo.xxxx.umd.js'],
  init: (rootApp) => {},
  components: {
    example: () =>
      import('./components/example'),
  },
})
```


+ `VueMfe.Lazy(path: string): Promise<any>` lazy load module or component [source code](./src/core/lazy.js)

```js
import VueMfe from 'vue-mfe'

/**
 * Lazy
 * @description resolve the application name by the given url, lazy load module or component from remote
 * @tutorial
 *  1. if a remote component, css styles must be inside of the component
 *  2. the remote module or component also support code-splitting
 *  3. the all properties in `SubAppConfig` could be imported dynamically
 * @param {string} url appName+delimiter+[propertyName?]+componentName
 * @param {string} [delimiter]
 * @example
 *  ```js
 *    const LazyModule = VueMfe.lazy('appName.propertyName')
 *  ```
 * @example
 *  ```js
 *    const FlowLayout = VueMfe.lazy('wf.components.FlowLayout')
 *  ```
 */
VueMfe.Lazy('demo.components.example')
```


+ `VueMfe.isInstalled(prefix: string): boolean` whether the application is installed or not [source code](./src/core/app/status.js)

```js
import VueMfe from 'vue-mfe'

/**
 * isInstalled
 * @param {string} prefix
 */
VueMfe.isInstalled('demo')
```


## TODO
+ [ ] unit test cases
+ [x] deploy docs by vuepress & netlify
+ [x] publish package to npm registry


## Thanks

If it has any help or inspiration, please give me a star to light my days. And if you have any confusing problem just go to make an issue, i'll fix or answer it when i see that.
