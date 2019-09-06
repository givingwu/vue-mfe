import VueRouter from 'vue-router'
import { refresh } from './refresh'
import { getRouter } from '../app/config'
import { findRoute } from '../../utils/route'
import { isString, isArray } from '../../utils/type'

/**
 * @typedef {import('../../index').Router} Router
 * @typedef {import('../../index').Route} Route
 */

/**
 * addRoutes
 * @description Add new routes into current router, and supports dynamic nest
 * @see
 *  + [Dynamically add child routes to an existing route](https://github.com/vuejs/vue-router/issues/1156)
 *  + [Feature request: replace routes dynamically](https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465)
 * @param {Array<Route>} newRoutes VueRoute route option
 * @param {string} [parentPath]
 * @param {Array<Route>} [oldRoutes]
 */
export function addRoutes(newRoutes, parentPath, oldRoutes) {
  // before merge new routes we need to check them out does
  // any path or name whether duplicate in old routes
  refresh(newRoutes, parentPath)

  // reset current router's matcher with merged routes
  getRouter().matcher = new VueRouter(
    normalizeOptions(
      // @ts-ignore
      adaptRouterOptions(oldRoutes || getRouter()),
      { routes: newRoutes },
      parentPath
    )
    // @ts-ignore
  ).matcher
}

/**
 * @param {Route[]|Router} routesOrRouter
 */
function adaptRouterOptions(routesOrRouter) {
  if (routesOrRouter) {
    if (routesOrRouter instanceof VueRouter) {
      return routesOrRouter.options
    } else if (isArray(routesOrRouter)) {
      return { routes: routesOrRouter }
    }
  }

  return {}
}

/**
 * @description normalize the options between oldRouter and newRouter with diff config options
 * @param {Router["options"]} oldOpts oldRouter
 * @param {Router["options"]} newOpts newROuter
 * @param {string} [parentPath]
 * @returns {Object}
 */
function normalizeOptions(oldOpts, newOpts, parentPath) {
  const { routes: oldRoutes = [], ...oldProps } = oldOpts
  const { routes: newRoutes = [], ...newProps } = newOpts

  return Object.assign(
    {
      routes: mergeRoutes(oldRoutes, newRoutes, parentPath)
    },
    newProps,
    oldProps
  )
}

/**
 * mergeRoutes
 * @param {Array<Route>} oldRoutes
 * @param {Array<Route>} newRoutes
 * @param {string} [parentPath]
 * @returns {Array<Route>} oldRoutes
 */
function mergeRoutes(oldRoutes, newRoutes, parentPath) {
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
          (oldRoute.children || (oldRoute.children = [])).push(
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
