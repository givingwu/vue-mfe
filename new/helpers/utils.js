export const isArray = (arr) => Array.isArray(arr)

export const isFunction = (fn) => fn && typeof fn === 'function'

export const isObject = (obj) => obj && typeof obj === 'object'

export const isString = (str) => typeof str === 'string'

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
export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * camelize
 * @param {String} str
 * @param {Boolean} pascalCase
 */
export const camelize = (str, pascalCase = false) => {
  return str
    .split(/-|_|\s/g)
    .map((s, i) => (!pascalCase && i === 0 ? s : capitalize(s)))
    .join('')
}

export const resolveModule = (module) => {
  return (module && module.default) || module
}

export const getAppPrefixName = (to) =>
  to.name && to.name.includes('.')
    ? filterByDelimiter(to.name, '.')
    : filterByDelimiter(to.path, '/')

export function filterByDelimiter(str, delimiter) {
  return (
    str
      .split(delimiter)
      /* filter all params form router to get right name */
      .filter(
        (s) => !Object.values(GlobalPageRouter.currentRoute.params).includes(s)
      )
      .filter(Boolean)
      .map((s) => s.trim())
      .shift()
  )
}

export const defineImmutableProp = (obj, key, val) => {
  Object.defineProperty(obj, key, {
    value: val,
    configurable: false,
    enumerable: false,
    writable: false,
  })
}

export const serialExecute = (promises) => {
  return promises.reduce((chain, next) => {
    return chain
      .then((retVal) => next(retVal))
      .catch((err) => {
        throw err
      })
  }, Promise.resolve())
}

export function lazyloadStyle(url) {
  const link = document.createElement('link')
  const timeout = 1.2e4

  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.charset = 'utf-8'
  link.href = url
  link.setAttribute('force', false)

  let timerId = setTimeout(
    () => onLoadFailed(`Reject script ${url} error`),
    timeout
  )

  function clearState() {
    clearTimeout(timerId)
    link.onerror = link.onload = link.onreadystatechange = null // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
  }

  return new Promise((resolve, reject) => {
    link.onload = function() {
      clearState()
      resolve(...arguments)
    }

    link.onerror = function() {
      clearState()
      reject(...arguments)
    }

    document.head.appendChild(link)
  })
}

/**
 * lazyLoadScript
 * @author Vuchan
 * @desc lazy load script form a remote url then returns a promise
 * @param {String} url remote-url
 * @param {String} globalVar global variable key
 * @return {Promise}
 */
export function lazyLoadScript(url, globalVar) {
  const script = document.createElement('script')
  const timeout = 1.2e4

  script.type = 'text/javascript'
  script.charset = 'utf-8'
  script.src = url
  script.async = true
  script.setAttribute('nonce', 'nonce')

  let timerId = setTimeout(
    () => onLoadFailed(`Reject script ${url}: LOAD_SCRIPT_TIMEOUT`),
    timeout
  )

  function clearState() {
    clearTimeout(timerId)
    script.onerror = script.onload = script.onreadystatechange = null // 同时检查两种状态，只要有一种触发就删除事件处理器，避免触发两次
    script.remove()
  }

  return new Promise((resolve, reject) => {
    function onLoadSuccess() {
      clearState()
      resolve(globalVar ? window[globalVar] : undefined, ...arguments)
    }

    function onLoadFailed() {
      clearState()
      reject(...arguments)
    }

    if (script.readyState !== undefined) {
      // IE
      script.onreadystatechange = function change(evt) {
        if (
          (script.readyState === 'loaded' ||
            script.readyState === 'complete') &&
          (globalVar ? window[globalVar] : true)
        ) {
          onLoadSuccess()
        } else {
          onLoadFailed(`Unknown error happened`, evt)
        }
      }
    } else {
      // Others
      script.onload = function load() {
        onLoadSuccess()
      }

      script.onerror = function error(evt) {
        onLoadFailed(`GET ${url} net::ERR_CONNECTION_REFUSED`, evt)
      }
    }

    document.body.appendChild(script)
  })
}
