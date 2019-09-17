import { parse, tokensToRegExp } from 'path-to-regexp'

export function findMatchedName(map, key) {
  // all names array
  const keys = Object.keys(map)

  if (keys) {
    /** @type {RegExp[]} */
    const regexps = keys.map((key) => tokensToRegExp(parse(key)))
    let i = 0
    let l = regexps.length

    while (i++ < l) {
      const regexp = regexps[i]

      if (regexp.test(key)) {
        return keys[i]
      }
    }
  }
}

/**
 * @description auto complete path with parent path
 * @param {string} path
 * @param {string} parentPath
 * @returns {string}
 */
export function completePath(path, parentPath) {
  if (parentPath === '/' && path !== '/' && path.startsWith('/')) {
    return ensurePathSlash(path)
  } else {
    return ensurePathSlash(parentPath) + ensurePathSlash(path)
  }
}

/**
 * ensurePathSlash
 * @param {string} path
 */
export function ensurePathSlash(path) {
  const trailingSlashRE = /\/?$/
  path = path !== '/' ? path.replace(trailingSlashRE, '') : path

  return path ? (ensureSlash(path) ? path : '/' + path) : '/'
}

/**
 * ensureSlash
 * @param {string} path
 */
export function ensureSlash(path) {
  return path.charAt(0) === '/'
}
