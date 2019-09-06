import { isObject } from '../utils/type'

/**
 * findRoute DFS
 * @typedef {import('vue-router').RouteConfig} Route
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
  return obj && isObject(obj) && obj.path && obj.component
}
