/**
 * findRoute 深度优先递归遍历找到匹配 matchPath 的 Route
 * @param {Array<Route>} routes
 * @param {String} matchPath
 * @returns {Object<Route>}
 */
export function findRoute(routes = [], matchPath) {
  let i = 0
  let matchedRoute = null
  const l = routes.length

  while (i < l) {
    const route = routes[i]
    const { path, children } = route

    if (path === matchPath) {
      /* 匹配路径 */
      return route
    } else if (children && children.length) {
      /* 深度优先遍历，不匹配，但是有children，则递归children并返回匹配结果 */
      matchedRoute = findRoute(children, matchPath)
      i++ /* 自增当前集合索引i */
    } else {
      i++ /* 自增当前集合索引i */
    }

    if (matchedRoute) {
      return matchedRoute
    }
  }
}

/**
 * @description auto complete path with parent path
 * @param {String} path
 * @param {String} parentPath
 * @returns {String}
 */
export function completePath(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

export function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path

  return path ? (ensureSlash(path) ? path : '/' + path) : ''
}

export function ensureSlash(path) {
  return path.charAt(0) === '/'
}
