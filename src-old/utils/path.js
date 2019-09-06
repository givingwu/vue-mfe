import { parse, tokensToRegExp } from 'path-to-regexp'

export function findRightKey(map, key) {
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
