import { getConfig } from './config'
import { isObject, isFunction } from '../../utils/type'
import { createError } from '../../helpers/create-error'
import { LOAD_RESOURCES_ERROR } from '../../constants/ERROR_CODE'

/**
 * @typedef {import('../..').Resources} Resources
 */
/** @type {Map<string, Resources>} */
const resources = new Map()

/**
 * getResource
 * @param {string} prefix
 * @returns {import('../..').Resources}
 */
export const getResource = (prefix) => {
  // 0. 先取缓存中的值
  const cached = resources.get(prefix)

  if (cached && isObject(cached)) {
    return cached
  }

  try {
    // 1. 再取 SubApp.config
    let config = getConfig(prefix)

    if (!config || !config.resources) {
      // 2. 最后取 HostApp.config
      config = getConfig()
    }

    if (config && config.resources) {
      if (isFunction(config.resources)) {
        // @ts-ignore
        const resource = config.resources()
        resources.set(prefix, resource)

        return resource
      }

      if (isObject(config.resources)) {
        const resource = config.resources
        resources.set(prefix, resource)

        return resource
      }
    }
  } catch (error) {
    createError(
      error,
      `Cannot get the resources .`,
      LOAD_RESOURCES_ERROR,
      prefix
    )
  }
}
