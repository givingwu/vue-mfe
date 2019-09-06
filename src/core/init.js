import { refresh } from './router/refresh'
import { addRoutes } from './router/index'
import { registerHook } from './register-hook'

/**
 * init 刷新路由映射同时注入路由 hook
 * @param {import('..').Router} router
 */
export function init(router) {
  if (router.addRoutes !== addRoutes) {
    router.addRoutes = addRoutes.bind(router)
  }

  // @ts-ignore
  refresh(router.options.routes)
  registerHook(router)
}
