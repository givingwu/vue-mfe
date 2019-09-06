import { isObject, isString } from './type'
import { getFirstWord } from './index'

/**
 * getAppPrefix
 * @param {string|Object} refOrStr
 */
export function getAppPrefix(refOrStr) {
  if (isString(refOrStr)) {
    return getFirstWord(refOrStr)
  }

  if (isObject(refOrStr)) {
    return refOrStr.prefix
  }
}
