import { isDev } from './env'
import { isFunction } from './type'

export const noop = () => {}

export const toArray = (args) => Array.prototype.slice.call(args)

export const hasConsole = // eslint-disable-next-line no-console
  typeof console !== 'undefined' && typeof console.warn === 'function'

export function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

export const warn = function warning() {
  if (isDev) {
    throw Error.apply(window, arguments)
  } else {
    // eslint-disable-next-line no-console
    hasConsole && console.warn.apply(window, arguments)
  }
}

export const log = function logging() {
  if (isDev) {
    // eslint-disable-next-line no-console
    hasConsole && console.log.apply(arguments)
  }
}

/* https://github.com/reduxjs/redux/blob/master/src/utils/actionTypes.js */
export const randomString = () =>
  Math.random().toString(36).substring(7).split('').join('.')

/**
 * capitalize
 * @param {String} str
 */
export const capitalize = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()

/**
 * camelize
 * @param {String} str
 * @param {Boolean} pascalCase
 */
export const camelize = (str, pascalCase = false) =>
  str
    .split(/-|_|\s/g)
    .map((s, i) => (!pascalCase && i === 0 ? s : capitalize(s)))
    .join('')

/**
 * @description Define immutable property for the given object
 * @param {Object} obj
 * @param {string} key
 * @param {*} val
 */
export const defineImmutableProp = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    value: val,
    configurable: false,
    enumerable: false,
    writable: false
  })
}
