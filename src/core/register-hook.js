import { install } from './install'
import { isInstalled } from './app/status'
import { getAppPrefix } from '../utils/app'
import { createError } from '../helpers/create-error'
import { getChildrenApp, installApps } from './app/children'
import { isUnmatchableRoute } from './router/is-unmatchable-route'
import {
  LOAD_ERROR_HAPPENED,
  LOAD_DUPLICATE_WITHOUT_PATH
} from '../constants/ERROR_CODE'

/**
 * registerHook
 * @param {import('vue-router').default} router
 */
export function registerHook(router) {
  // 处理 none-matched route 并尝试去安装和调用
  router.beforeEach(function handleUnmatchableRoute(to, from, next) {
    // @ts-ignore
    if (isUnmatchableRoute(to)) {
      const prefix = getAppPrefix(to.fullPath || to.path)
      const args = { name: prefix, to, from, next }

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

function installChildren(children, args) {
  const { next, to, name } = args

  return installApps(children)
    .then((success) => success && next && to && next(to))
    .catch((error) => {
      // eslint-disable-next-line no-console
      createError(error, '', LOAD_ERROR_HAPPENED, name, args)
    })
}
