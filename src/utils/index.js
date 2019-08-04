export const isDev = process.env.NODE_ENV === 'development'

export const isMaster = process.env.VUE_APP_MASTER !== undefined

export const isPortal = !isMaster || process.env.VUE_APP_PORTAL !== undefined

export const noop = () => {}

export const isArray = (arr) => Array.isArray(arr)

export const isFunction = (fn) => fn && typeof fn === 'function'

export const isObject = (obj) => obj && typeof obj === 'object'

export const isString = (str) => typeof str === 'string'

export const toArray = (args) => Array.prototype.slice.call(args)

export const hasConsole =
  // eslint-disable-next-line
  typeof console !== 'undefined' && typeof console.warn === 'function'

export function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

export const getLogger = (key) => (args) => {
  return assert(
    isDev,
    // eslint-disable-next-line
    () =>
      hasConsole &&
      console.log.apply(null, key ? [key, ...toArray(args)] : args),
    noop
  )
}

export const getWarning = (key) => (args) => {
  const throwError = (err) => {
    throw new Error(err)
  }

  // eslint-disable-next-line
  const fn = isDev ? throwError : hasConsole ? console.warn : noop

  return assert(true, () => {
    fn.apply(null, key ? [[key, ...toArray(args)].join(' > ')] : args)
  })
}

/* https://github.com/reduxjs/redux/blob/master/src/utils/actionTypes.js */
export const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

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
 * @description resolve module whether ES Module or CommandJS module
 * @template Module
 * @property {Object} [default]
 * @param {Module & Object} module
 * @returns {*}
 */
export const resolveModule = (module) => (module && module.default) || module

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

/**
 * @description execute an array of promises serially
 * @template T
 * @param {Array<Promise<T>>} promises
 * @returns {Promise<T>} the finally result of promises
 */
export const serialExecute = (promises) => {
  return promises.reduce((chain, next) => {
    return chain
      .then((retVal) => next(retVal))
      .catch((err) => {
        throw err
      })
  }, Promise.resolve())
}
