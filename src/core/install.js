import { isInstalled, setAppStatus } from './app/status'
import { getRootApp, getRouter, getConfig } from './app/config'
import { load } from '../helpers/loader'
import { createError } from '../helpers/create-error'
import { isRoute } from '../utils/route'
import { isArray, isObject, isFunction } from '../utils/type'
import { LOAD_ERROR_HAPPENED } from '../constants/ERROR_CODE'
import { START, SUCCESS, FAILED } from '../constants/LOAD_STATUS'
import { LOAD_START, LOAD_SUCCESS, LOAD_ERROR } from '../constants/EVENT_TYPE'

/**
 * @typedef {import('../index').Route} Route
 * @typedef {import('../index').Router} Router
 * @typedef {import('vue').default} VueComponent
 *
 * install
 * @param {{ name: string, next?: Function, to?: {}, app?: VueComponent }} args
 */
export const install = (args) => {
  const { name, next, to } = args

  if (isInstalled(name)) {
    return true
  }

  const app = getRootApp()

  setAppStatus(name, START)
  app.$emit(LOAD_START, args)

  const handleSuccess = () => {
    setAppStatus(name, SUCCESS)
    app.$emit(LOAD_SUCCESS, args)

    // After apply mini app routes, i must to force next(to)
    // instead of next(). next() do nothing... bug???
    next && to && next(to)
    return true
  }

  /**
   * handleError
   * @param {Error|string} error
   */
  const handleError = (error) => {
    setAppStatus(name, FAILED)
    // error-first like node?! 😊
    createError(error, '', LOAD_ERROR_HAPPENED, name, args)

    next && next(false) // stop navigating to next route
  }

  /**
   * vue-mfe v2.0 不再由上层执行 AppEntry 的代码，改由子应用内部自己
   * 调用工厂方法 createSubApp 传入配置，再完成后续的一系列初始化工作
   */
  return (
    load(name)
      .then((module) => installModule(module, name))
      // .then((routes) => installAppModule(routes, name))
      .then(handleSuccess)
      .catch(handleError)
  )
}

/**
 * installModule
 * @param {Module&Route&Route[]} module
 * @param {string} [name]
 */
function installModule(module, name) {
  if (isObject(module) && isRoute(module)) {
    return getRouter().addRoutes([module])
  }

  if (isArray(module) && module.every(isRoute)) {
    return getRouter().addRoutes(module)
  }

  const entry = resolveModule(module)
  const { parentPath: globalParentPath } = getConfig()

  // 不再向前兼容，如果导出的是 `export default function initSubApp(rootApp): Route[] {}`
  if (isObject(entry)) {
    // 最新API，导出的是 `export default createSubApp({ init: Function, routes: Route[], parentPath: string })`
    const { init, routes, parentPath } = entry

    return Promise.resolve(isFunction(init) && init(getRootApp())).then(() => {
      // @ts-ignore
      getRouter().addRoutes(routes, parentPath || globalParentPath)
    })
  } /* else if (isFunction(entry)) {
    return Promise.resolve(entry(getRootApp())).then((routes) => {
      // @ts-ignore
      getRouter().addRoutes(routes, globalParentPath)
    })
  } */ else {
    throw new Error(`
      Cannot not found 'export default VueMfe.createSubApp({ prefix: ${name}, routes: [] })' in '${name}/src/portal.entry.js'
    `)
  }
}

/**
 * @description resolve module whether ES or CommandJS module
 * @typedef {{ default: *, [key: string]: * }} Module
 * @param {Module} module
 * @returns {Module&Function}
 */
export const resolveModule = (module) => (module && module.default) || module
