import VueRouter from 'vue-router'
import { isDev, isString, isObject, getWarning } from '../utils'
import { findRoute, completePath } from '../utils/route'

/**
 * @class EnhancedRouter
 * @description Dynamically add child routes to an existing route & provides some `helpers` method
 */
export default class EnhancedRouter {
  static warn() {
    return getWarning(EnhancedRouter.name)(arguments)
  }

  /**
   * @typedef {import('vue-router').Route} VueRoute
   * @typedef {Object} EnhancedRoute
   * @property {string} parentPath
   * @property {Route[]} children
   * @typedef {VueRoute & EnhancedRoute} Route
   *
   * @typedef {import('vue-router').default} VueRouter
   * @typedef {Object} EnhancedRouterRef
   * @property {import('vue-router').RouteConfig} options
   * @property {Object} matcher
   * @typedef {VueRouter & EnhancedRouterRef} Router
   *
   * @param {Router} router
   */
  constructor(router) {
    if (router.addRoutes !== this.addRoutes) {
      router.addRoutes = this.addRoutes.bind(this)
    }

    this.router = router

    /**
     * @type {Route[]}
     */
    // @ts-ignore
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
    if (isDev) {
      console.log(this.pathList)
      console.log(this.pathMap)
    }

    this.refreshAndCheckState(routes, parentPath)
    this.router.matcher = new VueRouter(
      this.normalizeOptions(this.router.options, { routes }, parentPath)
      // @ts-ignore
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
        routes: this.mergeRoutes(oldRoutes, newRoutes, parentPath)
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
   * @returns {Array<Route>} oldRoutes
   */
  mergeRoutes(oldRoutes, newRoutes, parentPath) {
    const needMatchPath = parentPath

    newRoutes.forEach((route) => {
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
            ;(oldRoute.children || (oldRoute.children = [])).push(
              Object.assign({}, route, {
                path:
                  parentPath && path.startsWith('/')
                    ? (path = path.replace(/^\/*/, ''))
                    : path /* fix: @issue that nested paths that start with `/` will be treated as a root path */
              })
            )
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
   * @param {Array<Route>} routes
   * @param {String} [parentPath]
   *  1. from method calls: addRoutes(routes, parentPath)
   *  2. from route property: { path: '/bar', parentPath: '/foo', template: '<a href="/foo/bar">/foo/bar</a>' }
   */
  refreshAndCheckState(routes, parentPath) {
    routes.forEach(({ path, parentPath: selfParentPath, name, children }) => {
      /* 优先匹配 route self parentPath */
      if (selfParentPath) {
        path = this.getParentPath(path, selfParentPath, name)
      } else if (parentPath) {
        path = this.getParentPath(path, parentPath, name)
      }

      if (path) {
        if (!this.pathExists(path)) {
          this.pathList.push(path)
        } else {
          EnhancedRouter.warn(`The path ${path} in pathList has been existed`)
        }
      }

      if (name) {
        if (!this.nameExists(name)) {
          this.pathMap[name] = path
        } else {
          EnhancedRouter.warn(`The name ${name} in pathMap has been existed`)
        }
      }

      if (children && children.length) {
        return this.refreshAndCheckState(children, path)
      }
    })
  }

  getParentPath(path, parentPath, name) {
    if (this.pathExists(parentPath)) {
      return (path = completePath(path, parentPath))
    } else {
      EnhancedRouter.warn(
        `Cannot found the parent path ${parentPath} ${
          name ? 'of ' + name : ''
        } in Vue-MFE MasterRouter`
      )
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
    return (path && findRoute(this.routes, path)) || null
  }
}

export const createEnhancedRouter = (router) => new EnhancedRouter(router)
