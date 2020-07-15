import { install } from './install'
import { getPrefix } from '../utils/route'
import { createError } from '../helpers/create-error'
import { isInstalled, isInstalling } from './app/status'
import { getChildrenApp, installChildren } from './app/children'
import { isUnmatchableRoute } from './router/is-unmatchable-route'
import { LOAD_DUPLICATE_WITHOUT_PATH } from '../constants/ERROR_CODE'

/**
 * registerHook
 * @param {import('vue-router').default} router
 */
export function registerHook(router) {
  // 处理 none-matched route 并尝试去安装和调用
  router.beforeEach(function handleUnmatchableRoute(to, from, next) {
    // @ts-ignore
    if (isUnmatchableRoute(to)) {
      const prefix = getPrefix(to)
      if (!prefix) return

      const args = { name: prefix, to, from, next }

      if (isInstalling(prefix)) {
        return
      }

      if (isInstalled(prefix)) {
        const children = getChildrenApp(to.fullPath || to.path)

        if (children && children.length) {
          return installChildren(children, args)
        } else {
          createError(
            null,
            `${prefix} has been installed but it has no any path like ${to.path}`,
            LOAD_DUPLICATE_WITHOUT_PATH,
            prefix,
            args
          )
        }
      } else {
        return install(args)
      }
    } else {
      return next()
    }
  })
}
