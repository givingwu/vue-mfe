import Vue from 'vue'
import VueRouter from 'vue-router'
import { isDev, warn, info, assert } from './index'
import { defineImmutableProp } from './utils'

/* install router plugin */
Vue.use(VueRouter)

/**
 * master-memo-cache
 * 在 master-router 中维护的 pathList、pathMap，VueRouter 中也维护了这两个变量，但是没有暴露。
 * 本地维护有两个目的:
 *  1. 是在当 portal-router 中调用 `addPortalRoutes` 时，比对、校验、去重
 *  2. 暴露给 portal-app 看其是否需要，如果上游做了很完善的逻辑判断，似乎没必要在暴露到下游
 */
let pathList = []
let pathMap = {}

// 内部维护的两个闭包变量 _router, _routes
let _router = null // router: VueRouter
let _routes = [] // routes: Array<Route>

/**
 * createRouter 根据 routes 创建 router，但会新增一些内部方法以增强router
 * @param {Array<Route>} routes
 * @returns {Object<Router<VueRouter>>}
 * @inspired from https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
 */
export const createRouter = (routes = [], mode = 'history') => {
  /* 刷新内部私有的闭包变量 _routes */
  if (!_routes || !_routes.length) _routes = routes

  /* 刷新维护的路由状态 */
  refreshPathStates(routes)

  if (process.env.NODE_ENV === 'development') {
    info('pathList: ', pathList)
    info('pathMap: ', pathMap)
  }

  let router = new VueRouter({
    routes,
    // Use the HTML5 history API (i.e. normal-looking routes)
    // instead of routes with hashes (e.g. example.com/#/about).
    // This may require some server configuration in production:
    // https://router.vuejs.org/en/essentials/history-mode.html#example-server-configurations
    mode,
    // Simulate native-like scroll behavior when navigating to a new
    // route and using back/forward buttons.
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else {
        return { x: 0, y: 0 }
      }
    },
  })

  /*
   * 只能赋值1次，不可重复赋值。后续赋值更新了闭包中 _router 的引用，导致当前 router 的实例被更新。
   * 因为 _router.matcher === router.matcher 导致 resetRouter 中的动态修改 _router.matcher 无法生效
   */
  if (!_router) {
    _router = router
    const helpers = Object.create(null)

    defineImmutableProp(helpers, 'completePaths', completePaths)
    defineImmutableProp(helpers, 'findRoute', findRoute)
    defineImmutableProp(helpers, 'findPathName', findPathName)
    defineImmutableProp(helpers, 'nameExists', nameExists)
    defineImmutableProp(helpers, 'pathExists', pathExists)

    // 增加实例自身属性 addRoutes，不复写原型构造函数的成员方法
    defineImmutableProp(_router, 'addRoutes', addPortalRoutes)
    // 挂载工具方法 helpers 到 router 实例上 router.helpers.findPathName(path: String)
    defineImmutableProp(_router, 'helpers', helpers)
  }

  return router
}

/* 重置 master-router 的路由映射 Matcher */
function resetRouter(routes) {
  const newRouter = createRouter(routes)
  _router.matcher = newRouter.matcher // the relevant part

  return _router
}

/**
 * addPortalRoutes 添加新的 portal 路由，可按需指定嵌套的 parentPath
 * @param {Array<Route>} newRoutes 需要被注册到 master-router 的新路由
 * @param {routePath: String = '/'} prependPath
 *  newRoutes 默认注册到 '/' 的 children 下
 *  prependPath 优先级： prependPath parameter < route.parentPath
 * @summary
 *  1. 除非调用 resetRouter 方法，否则所有现有路由的 path 和 name 都是不允许被覆盖的
 * @issue
 *  + 在 parentPath 不为 '/' 的情况下，route 的 parentPath 如果带有 '/' 前缀，调用 `VueRouter.createMatcher` 的方法有 bug
 *  + route: { path: '/b', parentPath: '/error' } 在 master-router 存在 '/error' 的前提下，调用 router.match('/error/b') 无法 match
 */
function addPortalRoutes(newRoutes = [], prependPath = '/') {
  let hasParentPathRouteLength = 0
  const noParentPathRoutes = [] /* 没有声明 */
  const unRegisteredRoutes = newRoutes
    .filter((route) => {
      /* 过滤掉存在单个 parentPath 的路由 */
      if (!route.parentPath) {
        noParentPathRoutes.push(route)
        return false
      } else {
        /* 更新 flag，并返回 boolean */
        return Boolean(++hasParentPathRouteLength)
      }
    })
    .filter(
      (route) => !registerRoute(route) /* filter 取非返回注册未成功的路由 */
    )

  if (prependPath && noParentPathRoutes.length) {
    unRegisteredRoutes.concat(
      noParentPathRoutes.filter(
        (route) =>
          !registerRoute(Object.assign(route, { parentPath: prependPath }))
      )
    )
  }

  /* 当所有路由全部注册成功后，才重设 Matcher */
  if (
    /* 不存在 parentPathRoute && prependPath 或者 未注册成功的路由长度为0 */
    (!hasParentPathRouteLength && !prependPath) ||
    unRegisteredRoutes.length === 0
  ) {
    return resetRouter(_routes)
  } else {
    info('hasParentPathRouteLength: ', hasParentPathRouteLength)
    info('prependPath: ', prependPath)
    info('unRegisteredRoutes: ', unRegisteredRoutes)

    warn(
      `Add routes failed, those routes ${JSON.stringify(
        unRegisteredRoutes
      )} cannot be registered.`
    )
  }
}

/**
 * @method refreshPathStates
 * @description 递归刷新 pathList 和 pathMap
 * @param {Array<Route>} newRoutes
 * @param {String} parentPath
 */
function refreshPathStates(newRoutes = [], parentPath = '') {
  newRoutes.forEach(({ path, name, children }) => {
    if (parentPath) path = completePaths(path, parentPath)
    if (name && !pathMap[name]) pathMap[name] = path
    if (path && !pathList.includes(path)) pathList.push(path)

    if (children && children.length) {
      refreshPathStates(children, path)
    }
  })
}

/**
 * registerRoute 递归注册新路由
 * @param {Object<Route>} route
 * @param {Array<Route>} beforeRoutes
 * @returns {Boolean} true: 注册成功，false: 注册失败
 */
function registerRoute(
  { path, name, parentPath, ...props },
  beforeRoutes = _routes
) {
  const completePath = parentPath ? completePaths(path, parentPath) : path
  const existsPath = parentPath
    ? pathExists(completePath)
    : pathExists(completePath)
  const existNameWithPath = name && nameExists(name)

  assert(existsPath, () => {
    const pathName = findPathName(name)
    const errorMsg = `
      The path ${path} cannot be registered ${
      parentPath ? 'to parentPath ' + parentPath : ''
    },
      because of it was already registered ${
        pathName ? 'in pathMap ' + pathName : ''
      }before.
    `

    assert(
      /* 业务开发过程中，可能需要在自己开环境使用 path === '/' */
      path === '/',
      () => isDev && console.warn(errorMsg),
      () => warn(errorMsg)
    )
  })

  assert(existNameWithPath, () =>
    warn(`
      The name ${name} cannot be registered to path ${path}
      ${parentPath ? ' with parentPath ' + parentPath : ''}
    },
      because of it already registered in pathList ${existNameWithPath} before.
    `)
  )

  /* 如果存在 parentPath 且 parentPath 已存在记录 */
  if (parentPath && pathExists(parentPath)) {
    /* 递归找到匹配 parentPath 的 matchedRoute */
    const matchedRoute = findRoute(beforeRoutes, parentPath)

    if (matchedRoute) {
      const route = Object.assign(
        {
          path:
            parentPath !== '/' && path.startsWith('/')
              ? path.replace(/^\/*/, '')
              : path /* fix: addPortalRoutes() @issue */,
          name,
        },
        props || {}
      )

      if (matchedRoute.children && matchedRoute.children.length) {
        /* 这里不用再判断当前的 matchedRoute.children中 是否已存在相同的 completePath，因为上面的 existsPath 已经处理过 */
        matchedRoute.children.push(route)
      } else {
        matchedRoute.children = [route]
      }

      /* 注册成功 */
      return true
    } else {
      warn(
        `Register path '${path}' failed, cannot found parent path '${parentPath}',
        Are you sure the parent path exists in MasterRouter/routes before?`
      )
    }
  } else {
    warn(
      `Register path '${path}' failed, parentPath '${parentPath} does not exist'`
    )
  }
}

/**
 * findRoute 深度优先递归遍历找到匹配 matchPath 的 Route
 * @param {Array<Route>} routes
 * @param {String} matchPath
 * @returns {Object<Route>}
 */
function findRoute(routes = [], matchPath) {
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

function completePaths(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path

  return path ? (ensureSlash(path) ? path : '/' + path) : ''
}

function ensureSlash(path) {
  return path.charAt(0) === '/'
}

function pathExists(path) {
  return pathList.includes(path)
}

function nameExists(name) {
  return pathMap[name]
}

function findPathName(path) {
  return Object.keys(pathMap).find((name) => pathMap[name] === path)
}

export function getRouter() {
  return _router
}

export function getRoutes() {
  return _routes
}

export { addPortalRoutes }
