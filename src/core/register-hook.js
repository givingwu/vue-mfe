import { install } from './install'
import { getRootApp } from './app/config'
import { isInstalled } from './app/status'
import { getAppPrefix } from '../utils/app'
import { getChildrenApp, installApps } from './app/children'
import { LOAD_DUPLICATE_WITHOUT_PATH } from '../constants/ERROR_CODE'
import { LOAD_ERROR } from '../constants/EVENT_TYPE'

/**
 * registerHook
 * @param {import('vue-router').default} router
 */
export function registerHook(router) {
  // 处理 none-matched route 并尝试去安装和调用
  router.beforeEach(function handleUnmatchableRoute(to, from, next) {
    // @ts-ignore
    if (to.matched.length === 0 || router.match(to.path).matched.length === 0) {
      const prefix = getAppPrefix(to.fullPath || to.path)
      const args = { name: prefix, to, from, next }

      if (isInstalled(prefix)) {
        const children = getChildrenApp(to.fullPath || to.path)

        if (children && children.length) {
          return installChildren(children, args)
        } else {
          loadAppDuplicate(prefix, to)
        }
      } else {
        return install(args)
      }
    } else {
      return next()
    }
  })
}

function installChildren(children, { next, to }) {
  return installApps(children)
    .then((success) => success && next && to && next(to))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.log('error: ', error)
      // this.emit('error', error, args)
    })
}

function loadAppDuplicate(prefix, to) {
  const error = new Error(
    `${prefix} has been installed but it has no any path like ${to.path}`
  )
  // @ts-ignore
  error.code = LOAD_DUPLICATE_WITHOUT_PATH

  getRootApp().$emit(LOAD_ERROR, error)
}
