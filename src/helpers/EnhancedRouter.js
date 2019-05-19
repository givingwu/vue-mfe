import VueRouter from 'vue-router'
import { isString, isObject, getWarning } from '../utils'
import { findRoute, completePath } from '../utils/route'

/**
 * @class EnhancedRouter
 * @description Dynamically add child routes to an existing route
 */
export default class EnhancedRouter {
  static warning() {
    return getWarning(EnhancedRouter.name, arguments)
  }

  constructor(router) {
    if (router.addRoutes !== this.addRoutes) {
      router.addRoutes = this.addRoutes
    }

    this.router = router
    this.routes = router.options.routes
    this.pathMap = {}
    this.pathList = []

    this._init()
  }

  _init() {
    this.refreshAndCheckState(this.routes)
  }

  /**
   * @description Add new routes into current router, and supports dynamic nest
   * @see
   *  + [Dynamically add child routes to an existing route](https://github.com/vuejs/vue-router/issues/1156)
   *  + [Feature request: replace routes dynamically](https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465)
   * @param {Array<Route>} routes VueRoute route option
   * @param {?String} parentPath
   */
  addRoutes(routes, parentPath) {
    this.refreshAndCheckState(routes, parentPath)
    this.router.matcher = new VueRouter(
      this.normalizeOptions(this.router.options, { routes }, parentPath)
    ).matcher
  }

  /**
   * @description normalize the options between oldRouter and newRouter with diff config options
   * @param {Object} oldOpts oldRouter VueRouter configuration options
   * @param {Object} newOpts newROuter VueRouter configuration options
   * @param {?String} parentPath
   * @returns {Object}
   */
  normalizeOptions(oldOpts, newOpts, parentPath) {
    const { routes: oldRoutes, ...oldProps } = oldOpts
    const { routes: newRoutes, ...newProps } = newOpts

    return Object.assign(
      {
        routes: this.mergeRoutes(oldRoutes, newRoutes, parentPath),
      },
      newProps,
      oldProps
    )
  }

  /**
   * @description before merge new routes we need to check it out does its path or name duplicate in old routes
   * @param {Array<Route>} oldRoutes
   * @param {Array<Route>} newRoutes
   * @param {?String} parentPath
   */
  mergeRoutes(oldRoutes, newRoutes, parentPath) {
    const needMatchPath = parentPath

    newRoutes.forEach(route => {
      if (isString(route.parentPath)) {
        parentPath = route.parentPath
        delete route.parentPath
      } else {
        parentPath = needMatchPath
      }

      if (isString(parentPath)) {
        if (parentPath === '') {
          oldRoutes.push(route)
        } else {
          const oldRoute = findRoute(oldRoutes, parentPath)
          let path = route.path

          if (oldRoute) {
            (oldRoute.children || (oldRoute.children = [])).push(
              Object.assign({}, route, {
                path: (
                  parentPath && path.startsWith('/')
                    ? path = path.replace(/^\/*/, '')
                    : path
                ) /* fix: addPortalRoutes() @issue */,
              }))
          }
        }
      } else {
        oldRoutes.push(route)
      }
    })

    return oldRoutes
  }

  /**
   * @description 递归刷新路径 pathList 和 pathMap 并检查路由 path 和 name 是否重复
   * @param {Array<Route>} newRoutes
   * @param {String} parentPath
   *  1. 来自注册方法 addRoutes(routes, parentPath)
   *  2. 来自路由自身 { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
   */
  refreshAndCheckState(routes, parentPath) {
    routes.forEach(({ path, parentPath: selfParentPath, name, children }) => {
      /* 优先匹配 route self parentPath */
      if (selfParentPath) {
        path = this.getParentPath(path, selfParentPath, name)
      } else if (parentPath) {
        path = this.getParentPath(path, parentPath, name)
      }

      if (name) {
        if (!this.nameExists(name)) {
          this.pathMap[name] = path
        } else {
          EnhancedRouter.warning(`The name ${name} in pathMap has been existed`)
        }
      }

      if (path) {
        if (!this.pathExists(path)) {
          this.pathList.push(path)
        } else {
          EnhancedRouter.warning(`The name ${name} in pathMap has been existed`)
        }
      }

      if (children && children.length) {
        return this.refreshAndCheckState(children, path)
      }
    })
  }

  getParentPath(path, parentPath, name) {
    if (this.pathExists(parentPath)) {
      return path = completePath(path, parentPath)
    } else {
      EnhancedRouter.warning(`Cannot found the parent path ${parentPath} ${name ? 'of ' + name : ''} in Vue-MFE MasterRouter`)
      return ''
    }
  }

  pathExists(path) {
    return this.pathList.includes(path)
  }

  nameExists(name) {
    return this.pathMap[name]
  }

  findRoute(route) {
    let path = (isString(route) && route) || (isObject(route) && route.path)
    return path && findRoute(this.routes, path) || null
  }
}

export const createEnhancedRouter = (router) => new EnhancedRouter(router)
