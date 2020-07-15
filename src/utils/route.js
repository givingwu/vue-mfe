import { getFirstWord } from '../utils/app'
import { isObject, isString } from '../utils/type'

/**
 * getPrefix
 * @param {import('vue-router').Route} route
 */
export function getPrefix(route) {
  if (isObject(route)) {
    const path = route.fullPath || route.path

    if (isString(path)) {
      return getFirstWord(path)
    }

    const name = route.name

    if (isString(name)) {
      // we assume that the format of name of route is `AppName.Module.Route`
      return getFirstWord(name, '.')
    }
  }
}

/**
 * findRoute DFS
 * @typedef {import('vue-router').Route} Route
 * @param {Array<Route>} routes
 * @param {String} path
 * @returns {Route}
 */
export function findRoute(routes = [], path) {
  if (routes) {
    let route

    for (let i = 0; i < routes.length; i++) {
      route = routes[i]

      if (route.path === path) {
        return route
      }

      if (route.children && (route = findRoute(route.children, path))) {
        return route
      }
    }
  }
}

/**
 * isRoute
 * @param {Route} obj
 */
export function isRoute(obj) {
  return !!(
    isObject(obj) &&
    (obj.fullPath || obj.path || obj.name) &&
    obj.component
  )
}
