import { pathExists, nameExists } from './path'

export function isUnmatchableRoute(route) {
  if (route.name && nameExists(route.name)) {
    return false
  }

  if (pathExists(route.path)) {
    return false
  }

  return route.matched.length === 0
}
