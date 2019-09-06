import { SUCCESS } from '../../constants/LOAD_STATUS'

// 记录 app 加载状态
const appStatus = {}

/**
 * isInstalled
 * @param {string} prefix
 */
export function isInstalled(prefix) {
  return appStatus[prefix] === SUCCESS
}

export function setAppStatus(prefix, status) {
  return (appStatus[prefix] = status)
}

export function getAppStatus(prefix) {
  return appStatus[prefix]
}
