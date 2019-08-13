import {
  isString,
  isObject,
  isArray,
  isFunction,
  getWarning,
  getLogger,
  resolveModule
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

    this._init()
  }

  _init() {
    this.helpers = new EnhancedRouter(this.router)
    this.lazyloader = new Lazyloader().setConfig(this.config)

    this.router.beforeEach(async (to, from, next) => {
      if (
        to.matched.length === 0 ||
        this.router.match(to.path).matched.length === 0
      ) {
        const appName = this._getPrefixName(to)
        const args = { name: appName, to, from, next }

        if (this.isInstalled(appName)) {
          const error = new Error(
            `${appName} has been installed but it has no any path ${to.path}`
          )
          // @ts-ignore
          error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH

          this.emit('error', error, args)
        } else {
          return this.installApp(args)
        }
      } else {
        next()
      }
    })
  }

  installApp(args) {
    const { name, next, to } = args

    this.installedApps[name] = VueMfe.LOAD_STATUS.START
    this.emit('start', args)

    const handleSuccess = (success) => {
      VueMfe.log(`install app ${name} success`, success)

      if (success) {
        this.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS
        // After apply mini app routes, i must to force next(to)
        // instead of next(). next() do nothing... bug???
        next && to && next(to)

        this.emit('end', args)
      }
    }

    const handleError = (error) => {
      if (!(error instanceof Error)) error = new Error(error)
      if (!error.code) error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED

      this.installedApps[name] = VueMfe.LOAD_STATUS.FAILED
      next && next(false) // stop navigating to next route

      this.emit('error', error, args) // error-first like node?! 😊
    }

    return this.loadAppEntry(args)
      .then((module) => this.executeAppEntry(module))
      .then((routes) => this.installAppModule(routes))
      .then(handleSuccess)
      .catch(handleError)
  }

  /**
   * @param {string|{name: string}} name
   * @returns {Promise<AppModule>}
   */
  loadAppEntry(name) {
    return this.lazyloader.load(typeof name === 'string' ? { name } : name)
  }

  /**
   * executeAppEntry
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
  executeAppEntry(module) {
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
   * @throws {Error}
   */
  installAppModule(routes) {
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
      error.code = VueMfe.ERROR_CODE.APP_INIT_FAILED
      VueMfe.warn(error)

      return false
    }
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

  _getChildrenApps(route) {
    if (route && route.childrenApps) {
      return [].concat(route.childrenApps)
    } else {
      return false
    }
  }

  _installChildrenApps(route) {
    const childrenApps = this._getChildrenApps(route)
    const allPromises =
      childrenApps && childrenApps.map((name) => this.installApp({ name }))

    return Promise.all(allPromises).then((res) => {
      return res.every(Boolean)
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
  APP_INIT_FAILED: -3
}
