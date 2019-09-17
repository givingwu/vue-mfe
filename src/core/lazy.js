import { resolveModule } from './install'
import { registerApp, getConfig } from './app/config'
import { getFirstWord } from '../utils/app'
import { isFunction } from '../utils/type'
import { load } from '../helpers/loader'

/**
 * Lazy
 * @description 解析传入的名称获取应用前缀，懒加载应用并返回解析后的 module 内部变量
 * @tutorial
 *  1. 远程组件内部必须自包含样式
 *  2. 远程组件同样支持分片加载
 *  3. 可以引入所有被暴露的模块
 * @param {string} url appName+delimiter+[moduleName?]+componentName
 * @param {string} [delimiter] 分隔符
 * @example 引入特定 appName 应用下特定 moduleName 下特定 componentName
 *  ```js
 *    const LazyComponent = VueMfe.lazy('appName.moduleName.componentName')
 *  ```
 * @example 引入 workflow 下入口文件暴露出的 FlowLayout 组件，wf 为 appName，FlowLayout 为 portal.entry.js module 暴露出的变量
 *  ```js
 *    const FlowLayout = VueMfe.lazy('wf.components.FlowLayout')
 *  ```
 */
export function Lazy(url, delimiter = '.') {
  if (!getConfig()) {
    throw new Error(
      'Before you call `VueMfe.Lazy(url: string)` must set its config by `VueMfe.Lazy.setConfig({ resource: Resource[] })`'
    )
  }

  const appName = getFirstWord(url, delimiter)
  const keyPath = url.slice(appName.length + delimiter.length)

  return (
    appName &&
    load(appName).then((module) => {
      const component = getPropVal(resolveModule(module), keyPath)

      if (isFunction(component)) {
        return component()
      } else {
        return component
      }
    })
  )
}

Lazy.setConfig = function(config) {
  return registerApp(config)
}

/**
 * getPropVal
 * @param {Object} obj
 * @param {string} key
 */
const getPropVal = (obj, key) => {
  return key.split('.').reduce((o, k) => {
    return o[k]
  }, obj)
}
