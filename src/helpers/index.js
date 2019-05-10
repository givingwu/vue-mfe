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

export function info() {
  return assert(isDev, () => console.info.apply(console, arguments))
}

export function warn() {
  const fn =
    (!isDev &&
      (typeof console !== 'undefined' &&
        typeof console.warn === 'function' &&
        console.warn)) ||
    ((err) => {
      throw new Error(err)
    })

  return assert(true, () => {
    fn.apply(this, arguments)
  })
}
