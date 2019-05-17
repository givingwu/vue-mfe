import { isFunction } from './utils'

export const isDev = process.env.NODE_ENV === 'development'
export const isMaster = process.env.VUE_APP_MASTER !== undefined
export const isPortal = !isMaster || process.env.VUE_APP_PORTAL !== undefined

export function assert(condition, onSuccess, onFailure) {
  if (condition) {
    return isFunction(onSuccess) && onSuccess()
  } else {
    return isFunction(onFailure) && onFailure()
  }
}

export const noop = () => {}
export const hasConsole =
  typeof console !== 'undefined' && typeof console.warn === 'function'

export function info() {
  return assert(
    isDev,
    () => hasConsole && console.info.apply(console, arguments),
    noop
  )
}

export function warn() {
  const throwError = (err) => {
    throw new Error(err)
  }
  const fn = isDev ? throwError : hasConsole ? console.warn : noop

  return assert(true, () => {
    fn.apply(this, arguments)
  })
}
