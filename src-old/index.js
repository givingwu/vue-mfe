import {
  isArray,
  isString,
  isObject,
  isFunction,
  getLogger,
  getPropVal,
  getWarning,
  resolveModule,
  getPrefixAppName
} from './utils'
// @ts-ignore
import VueRouter from 'vue-router'
import Observer from './helpers/Observer'
import Lazyloader from './helpers/Lazyloader'
import EnhancedRouter from './helpers/EnhancedRouter'

let _Vue

/**
 * @class VueMfe
 * @description Vue micro front-end Centralized Controller
 */
export default class VueMfe extends Observer {
  static log() {
    return getLogger(VueMfe.name)(arguments)
  }

  static warn() {
    return getWarning(VueMfe.name)(arguments)
  }

  /**
   * @description To support a new Vue options `mfe` when Vue instantiation
   * see https://github.com/vuejs/vuex/blob/dev/src/mixin.js
   * @param {import('vue').VueConstructor} Vue
   */
  static install(Vue) {
    // @ts-ignore
    if (VueMfe.install.installed && _Vue === Vue) return
    // @ts-ignore
    VueMfe.install.installed = true

    _Vue = Vue

    const version = Number(Vue.version.split('.')[0])

    if (version >= 2) {
      Vue.mixin({ beforeCreate: initVueMfe })
    } else {
      // override init and inject vuex init procedure
      // for 1.x backwards compatibility.
      const _init = Vue.prototype._init
      Vue.prototype._init = function(options = {}) {
        options.init = options.init
          ? [initVueMfe].concat(options.init)
          : initVueMfe
        _init.call(this, options)
      }
    }

    function initVueMfe() {
      const options = this.$options
      // store injection
      if (options.mfe) {
        this.$mfe =
          typeof options.mfe === 'function' ? options.mfe() : options.mfe
      } else if (options.parent && options.parent.$mfe) {
        this.$mfe = options.parent.$mfe
      }
    }
  }

  /**
   * @typedef {import('vue-router').RouteConfig} VueRoute
   * @typedef {Object} EnhancedRoute
   * @property {string} parentPath The nested parent path
   * @property {string|Array<string>} childrenApps The nested children app name or names array
   * @typedef {VueRoute & EnhancedRoute} Route
   *
   * @typedef {import('vue-router').default} VueRouter
   * @typedef {Object} EnhancedRouterRef
   * @property {import('vue-router').RouteConfig} options
   * @property {Object} matcher
   * @typedef {VueRouter & EnhancedRouterRef} Router
   */
  constructor(opts = {}) {
    super()

    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here.
    if (
      /* eslint-disable-next-line no-undef */
      // @ts-ignore
      !Vue &&
      typeof window !== 'undefined' &&
      // @ts-ignore
      window.Vue &&
      // @ts-ignore
      !VueMfe.install.installed
    ) {
      // @ts-ignore
      VueMfe.install(window.Vue)
    }

    if (!opts || !opts.router || !(opts.router instanceof VueRouter)) {
      VueMfe.warn(
        'Must pass the router property in "Vue.use(VueMfe, { router, config })"'
      )
    }

    const { router, ...config } = opts

    this.router = router
    this.config = Object.assign({}, VueMfe.DEFAULTS, config)
    this.installedApps = {}
    this.helpers = new EnhancedRouter(this.router)
    this.lazyloader = new Lazyloader().setConfig(this.config)

    this._init()
  }

  _init() {
    this.router.beforeEach((to, from, next) => {
      // when none-matched path
      if (
        to.matched.length === 0 ||
        this.router.match(to.path).matched.length === 0
      ) {
        const appName = this._getPrefixName(to)
        const args = { name: appName, to, from, next }

        if (this.isInstalled(appName)) {
          const childrenApps = this.helpers.getChildrenApps(
            to.path || to.fullPath
          )

          if (childrenApps && childrenApps.length) {
            return this._installChildrenApps(childrenApps, args)
          } else {
            const error = new Error(
              `${appName} has been installed but it has no any path ${to.path}`
            )
            // @ts-ignore
            error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH

            this.emit('error', error, args)
          }
        } else {
          return this.installApp(args)
        }
      } else {
        return next()
      }
    })
  }

  /**
   * import
   * @description 解析传入的名称获取应用前缀，懒加载应用并返回解析后的 module 内部变量
   * @tutorial
   *  1. 远程组件内部必须自包含样式
   *  2. 远程组件同样支持分片加载
   *  3. 可以引入所有被暴露的模块
   * @param {string} name appName+delimiter+[moduleName?]+componentName
   * @param {string} delimiter 可自定义配置的分隔符
   * @example 引入特定 appName 应用下特定 moduleName 下特定 componentName
   *  ```js
   *    const LazyComponent = mfe.import('appName.moduleName.componentName')
   *  ```
   * @example 引入 workflow 下入口文件暴露出的 FlowLayout 组件，wf 为 appName，FlowLayout 为 portal.entry.js module 暴露出的变量
   *  ```js
   *    const FlowLayout = mfe.import('wf.components.FlowLayout')
   *  ```
   */
  import(name, delimiter = '.') {
    const appName = getPrefixAppName(name, delimiter)
    const keyPath = name
      .slice(appName.length + delimiter.length)
      .replace(delimiter, '.')

    return (
      appName &&
      this._loadAppEntry(appName).then((module) => {
        const component = getPropVal(module, keyPath)

        if (isFunction(component)) {
          return component()
        } else {
          return component
        }
      })
    )
  }

  isInstalled(route) {
    let name = route

    if (isObject(route) && /\//.exec(route.path)) {
      name = this._getPrefixName(route)
    } else if (isString(route) && /\//.exec(route)) {
      name = this._getPrefixNameByDelimiter(route, '/')
    }

    return this.installedApps[name] === VueMfe.LOAD_STATUS.SUCCESS
  }

  preinstall(name) {
    return name && this.installApp({ name })
  }

  installApp(args) {
    const { name, next, to } = args

    if (this.isInstalled(name)) {
      return true
    }

    this.installedApps[name] = VueMfe.LOAD_STATUS.START
    this.emit('start', args)

    /**
     * handleSuccess
     * @param {boolean} success
     */
    const handleSuccess = (success) => {
      VueMfe.log(`install app ${name} success`, success)

      if (success) {
        this.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS
        // After apply mini app routes, i must to force next(to)
        // instead of next(). next() do nothing... bug???
        next && to && next(to)

        this.emit('end', args)
      }

      return success
    }

    /**
     * handleError
     * @param {Error|string} error
     */
    const handleError = (error) => {
      if (!(error instanceof Error)) error = new Error(error)
      // @ts-ignore
      if (!error.code) error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED

      this.installedApps[name] = VueMfe.LOAD_STATUS.FAILED
      next && next(false) // stop navigating to next route

      this.emit('error', error, args) // error-first like node?! 😊
    }

    return this._loadAppEntry(args)
      .then((module) => this._executeAppEntry(module))
      .then((routes) => this._installAppModule(routes, name))
      .then(handleSuccess)
      .catch(handleError)
  }

  /**
   * @param {string|{name: string}} name
   * @returns {Promise<AppModule>}
   */
  _loadAppEntry(name) {
    return this.lazyloader.load(typeof name === 'string' ? { name } : name)
  }

  /**
   * _executeAppEntry
   * @description To executes the ESM/UMD app module
   * @typedef {import('vue').Component} VueComponent
   * @typedef {(app: VueComponent)=>Promise<Route[]>|Route[]|{init: (app: VueComponent)=>Promise<boolean>, routes: Route[]}} AppModule
   * @param {AppModule} module
   * @returns {Promise<Route[]>}
   * @summary
   *  1. module is a init function
   *    module: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
   *  2. module is an array of routes
   *    module: Array<Route>
   *  3. module is an object with property 'init' and 'routes'
   *    module: { init: Function, routes: Array<Route> }
   */
  _executeAppEntry(module) {
    module = resolveModule(module)

    /** @type {VueComponent}  */
    const app = this.router && this.router.app

    if (isFunction(module)) {
      // routes: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
      // @ts-ignore
      return Promise.resolve(module(app))
    } else if (isArray(module)) {
      // module: Array<Route>
      // @ts-ignore
      return module
    } else if (isObject(module)) {
      // module: { init: Promise<T>.then((success: boolean) => boolean), routes: Array<Route> }
      // @ts-ignore
      return isFunction(module.init) && Promise.resolve(module.init(app))
    }
  }

  /**
   * @param {Route[]} routes
   * @param {string} name
   * @throws {Error}
   */
  _installAppModule(routes, name) {
    if (isArray(routes)) {
      if (routes.length) {
        // @ts-ignore
        this.helpers.addRoutes(routes, this.config.parentPath)
        return true
      } else {
        VueMfe.warn('`Route[]` has no any valid item')
      }

      return false
    } else {
      let error = new Error(`Module ${name} initialize failed.`)
      if (routes instanceof Error) error = routes

      // @ts-ignore
      error.code = VueMfe.ERROR_CODE.LOAD_APP_INIT_FAILED
      VueMfe.warn(error)

      return false
    }
  }

  _installChildrenApps(apps, { next, to }) {
    const allPromises = apps.map((name) => this.installApp({ name }))

    return Promise.all(allPromises)
      .then((res) => {
        return res.every(Boolean)
      })
      .then((success) => {
        return success && next && to && next(to)
      })
  }

  /**
   * @description get the domain-app prefix name by current router and next route
   * @param {VueRoute} route
   * @returns {string} name
   */
  _getPrefixName(route) {
    return (
      // @ts-ignore
      route.domainName ||
      (route.name && route.name.includes('.')
        ? this._getPrefixNameByDelimiter(route.name, '.')
        : this._getPrefixNameByDelimiter(route.path, '/'))
    )
  }

  _getPrefixNameByDelimiter(str, delimiter) {
    return (
      (this.config.ignoreCase ? str.toLowerCase() : str)
        .split(delimiter)
        /* filter all params form route to get right name */
        .filter(
          (s) => !Object.values(this.router.currentRoute.params).includes(s)
        )
        .filter(Boolean)
        .map((s) => s.trim())
        .shift()
    )
  }
}

VueMfe.version = '__VERSION__'
VueMfe.DEFAULTS = {
  ignoreCase: true,
  parentPath: null,
  getNamespace: (name) => `__domain__app__${name}`
}
VueMfe.LOAD_STATUS = {
  SUCCESS: 1,
  START: 0,
  FAILED: -1
}
VueMfe.ERROR_CODE = {
  LOAD_ERROR_HAPPENED: VueMfe.LOAD_STATUS.FAILED,
  LOAD_DUPLICATE_WITHOUT_PATH: -2,
  LOAD_APP_INIT_FAILED: -3
}