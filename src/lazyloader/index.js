import { getMasterConfig } from '../index'
import { getRouter } from '../helpers/routerHelpers'
import { warn, info, isDev, isPortal } from '../helpers/index'
import {
  camelize,
  isArray,
  isString,
  isObject,
  isFunction,
  resolveModule,
  serialExecute,
  lazyLoadScript,
  getAppPrefixName,
} from '../helpers/utils'

let cached = null

export function lazyloader(to, next) {
  const name = camelize(getAppPrefixName(to))
  const config = getMasterConfig(name) || {}
  const { onLoadStart, onLoadSuccess, onLoadError, getNamespace = () => `__domain__app__${name}` } = config

  isFunction(onLoadStart) && onLoadStart(name, config)
  info('app-name: ', name)

  return getRouteEntry(name, next)
    .then((url) => {
      return isDev && isObject(url) && !isArray(url)
        ? url
        : installScript(url, getNamespace(name))
    })
    .then((module) => {
      if (module) {
        return installModule(module)
      } else {
        throw new Error(
          `[vue-mfe/lazyloader]: Cannot get valid value of Module ${name}`
        )
      }
    })
    .then((success) => {
      if (success) {
        next(to)
        isFunction(onLoadSuccess) && onLoadSuccess(name, config)
      } else {
        throw new Error(`[vue-mfe/lazyloader]: Register dynamic routes failed`)
      }
    })
    .catch((error) => {
      isFunction(onLoadError) ? onLoadError(error, next) : next(false)
    })
}

/**
 * getRouteEntry
 * @todo TODO: 如果是本地开发环境，则此处不需要发起请求，import 本地资源即可
 * @desc 获取 Portal 路由入口 entry-[chunkhash:8].umd.js 文件
 * @param {Object} data => cached
 * @param {String} names => portal app name
 * @returns {Object|undefined}
 */
function getRouteEntry(name, next) {
  /* 先取本地JS Heap中缓存，无缓存再取Server */
  if (cached && cached[name]) {
    return Promise.resolve(cached[name])
  } else {
    return getResource().then((data) => {
      if (data) {
        // merge cached with data
        cached = Object.assign({}, cached, data)

        if (cached[name]) {
          return cached[name]
        } else {
          info('[vue-mfe/getRouteEntry]: resources object: ', data)
          warn(
            `[vue-mfe/getRouteEntry]: The '${name}' cannot be found in resources object: ${JSON.stringify(
              Object.keys(data)
            )}`
          )

          next(false)
        }
      } else {
        return next({ name: 404 })
      }
    })
  }
}

function getResource() {
  const config = getMasterConfig()

  try {
    return config && config.getResource && config.getResource()
  } catch (e) {
    return Promise.reject(e)
  }
}

/**
 * installScript
 * @desc 懒加载 JS 资源
 * @param {Array<String<URL>>|String<URL>} urls
 * @param {String} name
 */
function installScript(urls, name) {
  if (isArray(urls) && urls.length) {
    return serialExecute(
      urls.map((url) => () => lazyLoadScript(url, name))
    ).catch((err) => {
      throw err
    })
  } else if (isString(urls)) {
    return serialExecute([() => lazyLoadScript(urls, name)])
  }
}

function installModule(module) {
  module = resolveModule(module)

  const router = getRouter()
  const app = router.app || {}
  let routes = null

  // call init mini app (add routes mini app):
  if (module) {
    if (isFunction(module)) {
      // const value = await module(app)
      return Promise.resolve(module(app)).then(routes => {
        if (isArray(routes) && routes.length) {
          return router.addRoutes(routes)
        } else if (routes === false) {
          return warn(`[vue-mfe/installModule]: Module ${name} initialize failed.`)
        }
      })
    }

    // 如果直接是数组，则直接把这些数组理解成 routes
    if (isArray(module)) {
      routes = module
    } else if (isObject(module)) {
      // 如果不想进入后续逻辑，可在 init 函数中抛出错误即可
      // 因为 installModule 会 catch 这个错误然后抛出异常
      isFunction(module.init) && module.init(app)

      if (module.routes && module.routes.length) {
        routes = module.routes
      } else {
        return warn(
          `[vue-mfe/installModule]: Must pass a valid routes array in 'module.routes' property of ${name}!`
        )
      }
    }

    router.addRoutes(routes)

    // After apply mini app routes, i must to force next(to)
    // instead of next(). next() do nothing... bug???
    // next(to)
    return true
  } else {
    // stop navigating to next route
    // next(false)
    return false
  }
}
