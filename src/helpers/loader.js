/* eslint-disable */
import { isDev } from '../utils/env'
import { warn } from '../utils/index'
import { retry } from '../utils/retry'
import { lazyLoadScript, lazyloadStyle } from '../utils/dom'
import { isArray, isFunction, isObject } from '../utils/type'
import { getVarName } from '../core/app/config'
import { getResource } from '../core/app/resources'

let cached = {}

/**
 * load 根据 prefix 加载 resources
 * @param {string} prefix
 */
export function load(prefix) {
  return cached[prefix]
    ? Promise.resolve(cached[prefix])
    : getEntries(prefix).then((url) => {
        const resources = isFunction(url) ? url() : url

        try {
          return isDev && isObject(resources) && !isArray(resources)
            ? resources /* when local import('url') */
            : install(
                (isArray(resources) ? resources : [resources]).filter(Boolean),
                getVarName(prefix)
              ).then((module) => {
                return (cached[prefix] = module)
              })
        } catch (error) {
          throw new Error(error)
        }
      })
}

/**
 * getEntries 获取资源入口
 * @param {string} key
 */
const getEntries = (key) => {
  return Promise.resolve(getResource(key)).then((obj) => {
    return (
      (obj && obj[key]) ||
      warn(`The App key '${key}' cannot be found in ${JSON.stringify(obj)}`)
    )
  })
}

/**
 * install
 * @description install .js or .css files
 * @typedef {string} Link
 * @param {Array<Link>} urls
 * @param {string} name
 *
 * @returns {Promise<import('..').Resource>}
 */
const install = (urls, name) => {
  const css = urls.filter((url) => url.endsWith('.css'))
  const scripts = urls.filter((url) => url.endsWith('.js'))

  if (isArray(css) && css.length) {
    Promise.all(css.map((css) => lazyloadStyle(css))).catch(warn)
  }

  if (isArray(scripts) && scripts.length) {
    return serialExecute(
      // @ts-ignore
      scripts.map((script) => () => retry(() => lazyLoadScript(script, name)))
    ) /* .catch((error) => {
      warn(error)
    }) */
  } else {
    warn(`No any valid script be found in ${urls}`)
  }
}

/**
 * @description execute an array of promises serially
 * @template T
 * @param {Array<Promise<T>>} promises
 * @returns {Promise<T>} the finally result of promises
 */
const serialExecute = (promises) => {
  return promises.reduce((chain, next) => {
    return (
      chain
        // @ts-ignore
        .then((retVal) => next(retVal))
        .catch((err) => {
          throw err
        })
    )
  }, Promise.resolve())
}
