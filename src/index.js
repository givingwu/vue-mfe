import createMasterRouter from './createMasterRouter'
import createRouterInterceptor from './helpers/createRouterInterceptor'
import { defineImmutableProp } from './helpers/utils'
import {
  createRouter,
  addPortalRoutes,
  getRouter,
  getRoutes,
} from './helpers/routerHelpers'

/**
 * createPageRouter 中心化路由
 * @description 闭包缓存 _router, _routes & _config
 * @param {Array<Route>} routes
 * @returns {}
 */
export function createPageRouter(routes, config, mode) {
  let hasRouter = hasMasterRouter()
  let router = hasRouter ? addPortalRoutes(routes) : createRouter(routes, mode)

  /* flag: 是否绑定增强特性 */
  if (!hasRouter) {
    router._config = config || {}
    /* 创建全局引用，避免 portal 覆盖了 GlobalPageRouter */
    defineImmutableProp(window, 'GlobalPageRouter', router)
    /* 拦截未装载路由 */
    createRouterInterceptor(router)
  }

  return router
}

export {
  getRouter as getMasterRouter,
  getRoutes as getMasterRoutes,
  createMasterRouter,
}
export function hasMasterRouter() {
  return window.GlobalPageRouter !== null && getRouter() !== null
}
export function getMasterConfig() {
  return (hasMasterRouter() && getRouter()._config) || {}
}
