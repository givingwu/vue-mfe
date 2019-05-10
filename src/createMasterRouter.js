import { createPageRouter } from './index'
import { isArray, isObject } from './helpers/utils'
import { warn } from './helpers/index'

/**
 * createMasterRouter
 * @description 如果是 MasterRouter 则直接覆盖 PageRouter
 * @param {Array|Object} routesOrConfig
 * @returns
 */
export default function createMasterRouter(routesOrConfig) {
  if (isArray(routesOrConfig)) {
    return createPageRouter(routesOrConfig)
  } else if (isObject(routesOrConfig)) {
    const { routes, mode, ...config } = routesOrConfig

    if (isArray(routes) && routes.length) {
      return createPageRouter(routes, config, mode)
    }
  }

  warn(
    'Must pass a valid routes array for `createMaster(config: { routes: Array<Route>, [props]: any }): Object<Master>>`'
  )
}
