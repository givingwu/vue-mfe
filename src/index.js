import VueRouter from 'vue-router'
import { Lazy } from './core/lazy'
import { registerApp } from './core/app/config'
import { isInstalled } from './core/app/status'
import { init as initRouter } from './core/init'
import { DEFAULT_CONFIG } from './constants/DEFAULT_CONFIG'

/**
 * @typedef {import('vue-router').default} VueRouter
 * @typedef {import('vue-router').RouteConfig} VueRoute
 *
 * @typedef {Object} VueMfeRoute
 * @property {string} [parentPath] The nested parent path
 * @property {string|Array<string>} [childrenApps] The nested children apps or name array
 * @typedef {VueRoute & VueMfeRoute} Route
 *
 * @typedef {Object} VueMfeRouter
 * @property {import('vue-router').RouterOptions} [options]
 * @property {{}} [matcher]
 * @typedef {VueRouter & VueMfeRouter} Router
 *
 * @typedef AppConfig
 * @property {Router} router 必选，主应用 VueRouter 根实例
 * @property {boolean} [sensitive] 可选，默认 false，是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
 * @property {string} [parentPath] 可选，默认 '/'，默认路由被嵌套的父路径
 * @property {Resources} [resources] 可选，获取资源的配置函数，支持同步/异步的函数/对象。

 * @typedef {SubAppConfig|Promise<SubAppConfig>|(()=>SubAppConfig)|(()=>Promise<SubAppConfig>)} ConfigResource
 * @typedef {Object<string, string[]>|Object<string, ConfigResource>} Resource
 *
 * @callback ResourcesFn
 * @returns {Resource|Resource[]|Promise<Resource>}
 * @typedef {Resource|Resource[]|ResourcesFn} Resources
 *
 * @param {AppConfig} config
 *
 * 1. 初始化路由，记录 rootApp
 * 2. 添加钩子，拦截无匹配路由
 * 3. 懒加载无匹配路由的 resources
 */
export function createApp(config) {
  // required property
  if (!config.router) {
    throw new Error(
      `Missing property 'router: VueRouter' in config \n${JSON.stringify(
        config
      )}`
    )
  }

  if (!(config.router instanceof VueRouter)) {
    throw new Error(
      `The router must be an instance of VueRouter not ${typeof config.router}`
    )
  }

  // At fist, set the global config with wildcard key '*'
  registerApp(Object.assign({}, DEFAULT_CONFIG, config))

  // Then enhance router and register before-hook to intercept unmatchable route
  initRouter(config.router)
}

/**
 * createSubApp
 * @typedef {Object} SubAppConfig
 * @property {string} prefix 必选，需要被拦截的子应用路由前缀
 * @property {Route[]} routes 必选，需要被动态注入的子应用路由数组
 * @property {string} [name] 可选，子应用的中文名称
 * @property {(app: Vue)=>boolean|Error|Promise<boolean|Error>} [init] 子应用初始化函数和方法
 * @property {string} [parentPath] 可选，子应用默认的父路径/布局
 * @property {Resources} [resources] 可选，子应用的 resources 配置项，获取资源的配置函数，支持同步/异步的函数/对象
 * @property {string} [globalVar] 可选，入口文件 app.umd.js 暴露出的全部变量名称
 * @property {Object<string, (() => Promise<{}>)|{}>} [components] 可选，暴露出的所有组件
 *
 * @param {SubAppConfig} config
 *
 * 1. 安装子应用调用 createSubApp 方法
 * 2. 调用 registerApp 刷新内部的维护的 configMap
 * 3. 执行 SubApp 的 init(app) => void|boolean 方法，初始化项目的前置依赖
 * 4. 初始化成功后返回 success 并安装子应用路由
 * 5. next(to) 到具体的子路由，END
 */
export function createSubApp(config) {
  // required property
  if (!config.prefix) {
    throw new Error(
      `Missing property 'prefix: string' in config \n${JSON.stringify(config)}`
    )
  }

  // required property
  if (!config.routes) {
    throw new Error(
      `Missing property 'routes: Route[]' in config \n${JSON.stringify(config)}`
    )
  }

  registerApp(config)

  return config
}

const VueMfe = {
  version: '__VERSION__',
  Lazy,
  createApp,
  createSubApp,
  isInstalled
}

// Auto install if it is not done yet and `window` has `Vue`.
// To allow users to avoid auto-installation in some cases,
if (
  /* eslint-disable-next-line no-undef */
  // @ts-ignore
  typeof window !== 'undefined' &&
  // @ts-ignore
  window.Vue &&
  // @ts-ignore
  (!window.VueMfe || window.VueMfe !== VueMfe)
) {
  // install VueMfe to global context
  // @ts-ignore
  window.VueMfe =
  // @ts-ignore
    window.VueMfe && window.VueMfe.version === VueMfe.version
    // @ts-ignore
      ? window.VueMfe
      : VueMfe
}

export default VueMfe
