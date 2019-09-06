import { isString, isFunction, isObject } from '../../utils/type'

/**
 * @typedef {import("../..").AppConfig} AppConfig
 * @typedef {import("../..").SubAppConfig} SubAppConfig
 */
/** @type {Map<string, SubAppConfig>} */
const configMap = new Map()

/**
 * getResource
 * @param {string} prefix
 * @returns {import('../..').Resources}
 */
export const getResource = (prefix) => {
  // 1. 先取 SubApp.config
  let config = getConfig(prefix)

  if (!config || !config.resources) {
    // 2. 再取 HostApp.config
    config = getConfig()
  }

  if (config && config.resources) {
    if (isFunction(config.resources)) {
      // @ts-ignore
      return config.resources()
    }

    if (isObject(config.resources)) {
      return config.resources
    }
  }
}

/**
 * @returns {import('../..').Router}
 */
// @ts-ignore
export const getRouter = () => getConfig().router

export const getRootApp = () => getRouter().app

/**
 * @param {string} prefix
 * @returns {import('../..').Route[]}
 */
export const getRoutes = (prefix) => getConfig(prefix).routes

/**
 * getComponent
 * @param {string} prefix
 * @param {string} componentName
 */
export const getComponent = (prefix, componentName) => {
  const components = getConfig(prefix).components

  if (components && isObject(components)) {
    return components[componentName]
  }
}

/**
 * getVarName
 * @param {string} prefix
 */
export const getVarName = (prefix) => {
  return getConfig(prefix).globalVar || '__domain__app__' + prefix
}

/**
 * getAppName
 * @param {string} prefix
 */
export const getAppName = (prefix) => {
  return getConfig(prefix).name
}

/**
 * getConfig
 * @param {string} prefix
 * @returns {SubAppConfig}
 */
export const getConfig = (prefix = '*') => {
  // @ts-ignore
  return configMap.get(prefix) || {}
}

/**
 * registerApp 注册应用并记录配置到 configMap
 * @param {string|AppConfig|SubAppConfig} prefix
 * @param {SubAppConfig} [config]
 */
export const registerApp = (prefix, config) => {
  // 默认的全局配置为 { *: config }
  if (isObject(prefix)) {
    // @ts-ignore
    config = prefix
    prefix = config.prefix || '*'
  }

  if (isString(prefix) && isObject(config)) {
    // @ts-ignore
    return configMap.set(prefix, config)
  }

  return false
}
