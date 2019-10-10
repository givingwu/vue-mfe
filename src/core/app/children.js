import { install as installApp } from '../install'
import { completePath, findMatchedName } from '../../utils/path'
import { createError } from '../../helpers/create-error'
import { LOAD_ERROR_HAPPENED } from '../../constants/ERROR_CODE'

const appMap = {}

export const registerChildren = (apps, path) => {
  if (apps) {
    ([].concat(apps)).forEach((app) => {
      if (typeof app === 'object') {
        const appKeys = Object.keys(app)
        appKeys.forEach((appName) => {
          const appPath = app[appName]

          appMap[completePath(appPath, path)] = appName
        })
      } else {
        appMap[completePath(app, path)] = name
      }
    })
  }
}

export function installChildren(children, args) {
  const { next, to, name } = args

  return installApps(children)
    .then((success) => success && next && to && next(to))
    .catch((error) => {
      // eslint-disable-next-line no-console
      createError(error, '', LOAD_ERROR_HAPPENED, name, args)
    })
}

export const getChildrenApp = (path) => {
  let apps = appMap[path]

  /**
   * 需要处理这种情况的路径例： ‘/path/:var’，'/wf/:projectSysNo/form/design'
   * 路径不是固定 string ‘/a/b’，所以无法直接通过 {key: val} 映射得到对应的结果
   * 因此引入了 pathToRegExp 这个 lib 来处理这种情况，如果 reg.test(path)
   * 则认为匹配成功
   */
  if (!apps) {
    const key = findMatchedName(appMap, path)

    if (key) {
      apps = appMap[key]
    }
  }

  if (apps) {
    return [].concat(apps)
  }

  return null
}

export const installApps = (apps) => {
  const promises = apps.map((name) => installApp({ name }))

  return Promise.all(promises).then((res) => {
    return res.every(Boolean)
  })
}
