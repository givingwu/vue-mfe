import { load } from '../helpers/loader'
import { isRoute } from '../utils/route'
import { resolveModule } from '../utils/index'
import { isArray, isObject, isFunction } from '../utils/type'
import { getRootApp, getRouter, getConfig } from './app/config'
import { isInstalled, setAppStatus } from './app/status'
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
  }

  /**
   * handleError
   * @param {Error|string} error
   */
  const handleError = (error) => {
    if (!(error instanceof Error)) error = new Error(error)
    // @ts-ignore
    if (!error.code) error.code = LOAD_ERROR_HAPPENED

    setAppStatus(name, FAILED)
    app.$emit(LOAD_ERROR, error, args) // error-first like node?! 😊

    next && next(false) // stop navigating to next route
  }

  /**
   * vue-mfe v2.0 不再由上层执行 AppEntry 的代码，改由子应用内部自己
   * 调用工厂方法 createSubApp 传入配置，再完成后续的一系列初始化工作
   */
  return (
    load(name)
      .then((module) => installModule(module))
      // .then((routes) => installAppModule(routes, name))
      .then(handleSuccess)
      .catch(handleError)
  )
}

/**
 * installModule
 * @param {*} module
 */
function installModule(module) {
  if (isObject(module) && isRoute(module)) {
    return getRouter().addRoutes([module])
  }

  if (isArray(module) && module.every(isRoute)) {
    return getRouter().addRoutes(module)
  }

  const { init, routes, parentPath } = resolveModule(module)
  const { parentPath: globalParentPath } = getConfig()

  return Promise.resolve(isFunction(init) && init(getRootApp())).then(() => {
    // @ts-ignore
    getRouter().addRoutes(routes, parentPath || globalParentPath)
  })
}
