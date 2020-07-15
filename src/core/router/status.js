import { SUCCESS, START } from '../../constants/LOAD_STATUS'

// 记录 app 加载状态
const appStatus = {}

/**
 * isInstalled 已安装
 * @param {string} prefix
 */
export function isInstalled(prefix) {
  return appStatus[prefix] === SUCCESS
}

/**
 * isInstalling 正在安装
 * @param {string} prefix
 */
export function isInstalling(prefix) {
  return appStatus[prefix] === START
}

export function setAppStatus(prefix, status) {
  return (appStatus[prefix] = status)
}

export function getAppStatus(prefix) {
  return appStatus[prefix]
}
