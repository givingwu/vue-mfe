import VueRouter from 'vue-router'
import { isString, isObject, isArray, isFunction, getWarning, getLogger, resolveModule } from './utils'
import Observer from './helpers/Observer'
import Lazyloader from './helpers/Lazyloader'
import EnhancedRouter from './helpers/EnhancedRouter'


/**
 * @class VueMfe
 * @description Vue micro front-end Centralized Controller
 */
export default class VueMfe extends Observer {
  static log () {
    return getLogger(VueMfe.name)(arguments)
  }

  static warn() {
    return getWarning(VueMfe.name)(arguments)
  }

  constructor(opts = {}) {
    super()

    if (!opts || !opts.router || !(opts.router instanceof VueRouter)) {
      VueMfe.warn('Must pass the router property in \'Vue.use(VueMfe, { router, config })\'')
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

    this.router.beforeEach((to, from, next) => {
      if (to.matched.length === 0 || this.router.match(to.path).matched.length === 0) {
        const appName = this._getPrefixName(to)
        const args = { name: appName, to, from, next}

        if (this.isInstalled(appName)) {
          const error = new Error(`${appName} has been installed but it does not have path ${to.path}`)
          error.code = VueMfe.ERROR_CODE.LOAD_DUPLICATE_WITHOUT_PATH

          this.emit('error', error, args)
        } else {
          this.installApp(args)
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

    return this.lazyloader.load(args)
      .then((module) => {
        VueMfe.log('installApp module', module)
        return this.installModule(module)
      })
      .then((success) => {
        VueMfe.log('installApp success', success)
        if (success) {
          this.installedApps[name] = VueMfe.LOAD_STATUS.SUCCESS

          // After apply mini app routes, i must to force next(to)
          // instead of next(). next() do nothing... bug???
          next && to && next(to)
          this.emit('end', args)
        }
      })
      .catch(error => {
        if (!(error instanceof Error)) error = new Error(error)
        if (!error.code) error.code = VueMfe.ERROR_CODE.LOAD_ERROR_HAPPENED
        this.installedApps[name] = VueMfe.LOAD_STATUS.FAILED

        next && next(false) // stop navigating to next route
        this.emit('error', error, args)
      })
  }

  /**
   * installModule
   * @description install ESM/UMD app module
   * @param {Module} module
   * @example
   *  1. module is a init function
   *    module: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
   *  2. module is an array of routes
   *    module: Array<Route>
   *  3. module is an object with property 'init' and 'routes'
   *    module: { init: Function, routes: Array<Route> }
   */
  installModule(module) {
    module = resolveModule(module)

    const router = this.router
    const app = router.app || {}

    // call init mini app (add routes mini app):
    if (module) {
      if (isFunction(module)) {
        // routes: () => Promise<T>.then((routes: Array<Route> | boolean) => boolean)
        return Promise.resolve(module(app)).then(routesOrBool => {
          return this._checkRoutes(routesOrBool)
        })
      } else if (isArray(module)) {
        // module: Array<Route>
        return this.addRoutes(module)
      } else if (isObject(module)) {
        // module: { init: Promise<T>.then((success: boolean) => boolean), routes: Array<Route> }
        return isFunction(module.init) && Promise.resolve(module.init(app)).then(bool => {
          return (bool === false || bool instanceof Error) ? this._checkRoutes(bool) : this.addRoutes(module.routes)
        })
      }
    } else {
      return false
    }
  }

  addRoutes(routes, parentPath) {
    if (routes) {
      if (routes.length) {
        this.helpers.addRoutes(routes, parentPath || this.config.parentPath)

        return true
      } else {
        VueMfe.warn('Routes has no any valid item')
      }
    } else {
      VueMfe.warn('Must pass a valid \'routes: Array<Route>\' in `addRoutes` method')
    }

    return false
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

  /**
   * @description get the domain-app prefix name by current router and next route
   * @param {VueRouter} router
   * @param {VueRoute} next
   * @param {?Boolean} ignoreCase
   */
  _getPrefixName (route) {
    return route.name && route.name.includes('.')
      ? this._getPrefixNameByDelimiter(route.name, '.')
      : this._getPrefixNameByDelimiter(route.path, '/')
  }

  _getPrefixNameByDelimiter(str, delimiter) {
    return (
      (this.config.ignoreCase ? str.toLowerCase() : str)
        .split(delimiter)
        /* filter all params form router to get right name */
        .filter(
          (s) => !Object.values(this.router.currentRoute.params).includes(s)
        )
        .filter(Boolean)
        .map((s) => s.trim())
        .shift()
    )
  }

  _checkRoutes(routesOrBool) {
    if (routesOrBool) {
      return this.addRoutes(routesOrBool)
    } else {
      if (routesOrBool instanceof Error) {
        routesOrBool.code = VueMfe.ERROR_CODE.APP_INIT_FAILED
        throw routesOrBool
      } else {
        VueMfe.warn('Module ' + name + ' initialize failed.')
      }
    }

    return false
  }
}

VueMfe.version = '__VERSION__'
VueMfe.DEFAULTS = {
  ignoreCase: true,
  parentPath: null,
  getNamespace: (name) => `__domain__app__${name}`,
}
VueMfe.LOAD_STATUS = {
  SUCCESS: 1,
  START: 0,
  FAILED: -1,
}
VueMfe.ERROR_CODE = {
  LOAD_ERROR_HAPPENED: VueMfe.LOAD_STATUS.FAILED,
  LOAD_DUPLICATE_WITHOUT_PATH: -2,
  APP_INIT_FAILED: -3,
}
