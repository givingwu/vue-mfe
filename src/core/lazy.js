import { registerApp, getConfig, getAppName } from './app/config'
import { getPropVal } from '../utils/index'
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
 * @example 引入特定 appName 应用下特定 moduleName 下特定 componentName
 *  ```js
 *    const LazyComponent = VueMfe.lazy('appName.moduleName.componentName')
 *  ```
 * @example 引入 workflow 下入口文件暴露出的 FlowLayout 组件，wf 为 appName，FlowLayout 为 portal.entry.js module 暴露出的变量
 *  ```js
 *    const FlowLayout = VueMfe.lazy('wf.components.FlowLayout')
 *  ```
 */
export const lazy = (url) => {
  if (!getConfig()) {
    throw new Error(
      'Before you calls `VueMfe.Lazy(url: string)` must setting its config use like `VueMfe.lazy.setConfig({ resource: Resources })`'
    )
  }

  const appName = getAppName(url)
  const keyPath = url.slice(appName.length + 1)

  return (
    appName &&
    load(appName).then((module) => {
      const component = getPropVal(module, keyPath)

      if (isFunction(component)) {
        return component()
      } else {
        return component
      }
    })
  )
}

lazy.setConfig = function(config) {
  registerApp(config)
}
