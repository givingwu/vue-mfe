import { isObject, isString } from './type'

/**
 * getAppPrefix
 * @param {string|{}} refOrStr
 */
export function getAppPrefix(refOrStr) {
  if (isString(refOrStr)) {
    return getFirstWord(refOrStr)
  }

  if (isObject(refOrStr)) {
    return refOrStr.prefix
  }
}

/**
 * getFirstWord
 * @param {string} str
 * @param {string} [delimiter]
 */
export const getFirstWord = (str = '', delimiter = '/') =>
  str
    .split(delimiter)
    .map((s) => s.trim())
    .filter(Boolean)
    .shift()
