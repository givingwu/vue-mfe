import { lazyloader } from '../lazyloader/index'
import { isDev, isMaster } from './index'

export default function createRouterInterceptor(router) {
  router.beforeEach((to, from, next) => {
    /* 如果是本地开发环境或者是 MasterRuntime 都需要对未知路由进行懒加载处理 */
    if (isDev || isMaster) {
      if (router.match(to.path).matched.length === 0) {
        lazyloader(to, next)
      } else {
        next()
      }
    } else {
      next({ name: 404 })
    }
  })
}
