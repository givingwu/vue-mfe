---
lang: zh-CN
---

# 快速上手

- [项目架构](#项目架构)
- [API](#api)
- [DEMO](#demo)

## 项目架构

```
 -----------------------------------------------------------------------------------------------
|                       MasterRuntime = VueMfe.createApp(config: AppConfig)                     |
| --------------------------------------------------------------------------------------------- |
|   VueMfe.createSubApp(config: SubAppConfig)   |   VueMfe.createSubApp(config: SubAppConfig)   |
| --------------------------------------------------------------------------------------------- |
|   VueMfe.createSubApp(config: SubAppConfig)   |   VueMfe.createSubApp(config: SubAppConfig)   |
 -----------------------------------------------------------------------------------------------
```

### App

微前端主项目(即基座项目)，使用 [VueMfe.createApp](#createapp) 创建。

- 提供公有登录、鉴权、校验、布局、组件、插件、数据(Vuex.store)等公共服务
- 通过 `VueMfe.createApp(config)` 注入**中心化路由**，配置，钩子方法

::: tip **如何处理公共依赖？**
通过 CDN 引入 UMD 格式处理公共依赖，再在每个 SubApp 中使用相同的 externals，以优化 JS 文件大小和构建速度(因为 SubApp 运行在 App 中)。
:::

### SubApp

基于 App(基座) 的各个子应用，使用 [VueMfe.createSubApp](#createsubapp) 创建。

- build 成 [UMD](https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/) 格式供 [App](#app) 引入 webpack unmanaged bundle。
  ::: tip
  子应用打包成 UMD 格式的主要原因是为了维护一个统一的 webpack build context。主运行时在 PRD 上跑的是 webpack 构建后的 bundle 代码，而子应用也支持被独立构建，那么变成了两个独立的 webpack build context 构建生成的 bundle。当时没有找到好的解决办法，所有用 UMD 上了。而后续在写 `VueMfe.Lazy` 的时候看到了社区有一种实现方式是使用 XHR 把 JS 文件请求到后使用 `new Function(require, exports, ${ XHRResponse.bodyText })` 拼接后执行。类似这样 [httpVueLoader ScriptContext.compile](https://github.com/FranckFreiburger/http-vue-loader/blob/master/src/httpVueLoader.js#L161)，但感觉还是没有 UMD 简单方便。
  :::
- build 的入口**必须是执行 `VueMfe.createApp`的文件**。 (因为该资源会被 [loader](https://github.com/vuchan/vue-mfe/blob/master/src/helpers/loader.js#L15) 通过 UMD 的暴露的全局变量动态装载。
  ::: warning
  路由的根路由必须以 `/${prefix}/` 开始，且 `${prefix}` 不能存在与另一 SubApp 的 prefix 重复，否则会抛出 `registerRoutes` 失败的错误。
  :::

## API

使用 [JSDoc](https://jsdoc.zcopy.site/) 注释和声明类型 Interface。

### createApp

`VueMfe.createApp({}: AppConfig): void` 创建 VueMfe 主（基座）应用，后续所有的 SubApp 都将被注册和装载到该应用。 [source code](https://github.com/vuchan/vue-mfe/blob/master/src/index.js#L41)

```javascript {38}
import VueMfe from 'vue-mfe'
import router from './router/index'

/**
 * @typedef {import('vue-router').default} VueRouter
 * @typedef {import('vue-router').RouteConfig} VueRoute
 *
 * @typedef {Object} VueMfeRoute
 * @property {string} [parentPath] 可选，父路径，即被注册(嵌套)到那个路由下
 * @property {string|Array<string>} [childrenApps] 可选，被嵌套的子应用
 * @typedef {VueRoute & VueMfeRoute} Route
 *
 * @typedef {Object} VueMfeRouter
 * @property {import('vue-router').RouterOptions} [options]
 * @property {{}} [matcher]
 * @typedef {VueRouter & VueMfeRouter} Router
 *
 * @typedef AppConfig
 * @property {Router} router 必选，主应用 VueRouter 根实例
 * @property {boolean} [sensitive] 可选，默认 false，是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
 * @property {string} [parentPath] 可选，默认 '/'，默认路由被嵌套的父路径
 * @property {Resources} [resources] 可选，获取资源的配置函数，支持同步/异步的函数/对象。
 * @typedef {SubAppConfig|Promise<SubAppConfig>|(()=>SubAppConfig)|(()=>Promise<SubAppConfig>)} ConfigResource
 * @typedef {Object<string, string[]>|Object<string, ConfigResource>} Resource
 *
 * @callback ResourcesFn
 * @returns {Resource|Resource[]|Promise<Resource>}
 * @typedef {Resource|Resource[]|ResourcesFn} Resources
 *
 * @param {AppConfig} config
 *
 * @description
 *  1. 初始化路由，记录 rootApp
 *  2. 添加钩子，拦截无匹配路由
 *  3. 懒加载无匹配路由的 resources
 */

export default VueMfe.createApp({
  router,
  sensitive: false,
  parentPath: '/',
  resources: []
})
```

### createSubApp

`SubAppConfig: createSubApp({}: SubAppConfig)` 创建一个 VueMfe SubApp 子应用。可以暴露任意组件给其他应用（App 和 SubApp）使用。[source code](https://github.com/vuchan/vue-mfe/blob/master/src/index.js#L84)

```javascript {26}
import VueMfe from 'vue-mfe'
import routes from './routes/index'

/**
 * createSubApp
 * @typedef {Object} SubAppConfig
 * @property {string} prefix 必选，需要被拦截的子应用路由前缀
 * @property {Route[]} routes 必选，需要被动态注入的子应用路由数组
 * @property {string} [name] 可选，子应用的中文名称
 * @property {(app: Vue)=>boolean|Error|Promise<boolean|Error>} [init] 子应用初始化函数和方法
 * @property {string} [parentPath] 可选，子应用默认的父路径即布局
 * @property {Resources} [resources] 可选，子应用的 resources 配置项，获取资源的配置函数，支持同步/异步的函数/对象
 * @property {string} [globalVar] 可选，入口文件 app.umd.js 暴露出的全部变量名称
 * @property {Object<string, (() => Promise<{}>)|{}>} [components] 可选，暴露出的所有组件
 *
 * @param {SubAppConfig} config
 *
 * @description
 *  1. 安装子应用调用 createSubApp 方法
 *  2. 调用 registerApp 刷新内部的维护的 configMap
 *  3. 执行 SubApp 的 init(app) => void|boolean 方法，初始化项目的前置依赖
 *  4. 初始化成功后返回 success 并安装子应用路由
 *  5. next(to) 到具体的子路由，END
 */

export default VueMfe.createSubApp({
  name: '示例项目',
  routes,
  prefix: '/demo',
  parentPath: '/',
  components: {
    Example: () => import('./components/example.vue')
  },
  init(app) {
    const loggedIn = app.$store.getters['auth/loggedIn']
    const hasPermission = app.$store.getters['auth/hasPermission']

    if (loggedIn) {
      if (hasPermission('demo')) {
        const userInfo = app.$store.getters['auth/currentUser']

        console.log(`用户${userInfo.userName}已登陆`)
      } else {
        console.log(`暂无权限`)
      }
    } else {
      console.log(`未登陆`)
    }
  }
})
```

### isInstalled

`VueMfe.isInstalled(prefix: string): boolean` 当前应用是否已被安装过。 [source code](https://github.com/vuchan/vue-mfe/blob/master/src/core/app/status.js#L10)

```javascript
import VueMfe from 'vue-mfe'

if (VueMfe.isInstall('prefix')) {
  console.log('SubApp prefix is installed before.')
} else {
  // code here...
}
```

### Lazy

`VueMfe.Lazy(path: string): Promise<any>` 远程加载一个 Module，可以是任意合法的 JavaScript 对象。[source code](https://github.com/vuchan/vue-mfe/blob/master/src/core/lazy.js#L25)

::: warning
在 VueMfe.Lazy 被其他 SubApp 调用之前，SubApp Demo 必须先暴露 Example 组件并打包成 UMD 格式并配置到 App Resource 中。
:::

```javascript {3}
import VueMfe from 'vue-mfe'

export default VueMfe.createSubApp({
  // 暴露出去的组件
  components: {
    Example: () => import('@/components/Example')
  }
})
```

在任意一个非 Demo 之外的 SubApp 中执行 VueMfe.Lazy 远程加载 Module:

````javascript
import VueMfe from 'vue-mfe'

/**
 * Lazy
 * @description 解析传入的名称获取应用前缀，懒加载应用并返回解析后的 module 内部变量
 * @tutorial
 *  1. 远程组件内部必须自包含样式
 *  2. 远程组件同样支持分片加载
 *  3. 可以引入所有被暴露的模块
 * @param {string} url appName+delimiter+[propertyName?]+[+delimiter+propertyName?]
 * @param {string} [delimiter] 分隔符
 * @example 引入特定 appName 应用下特定 propertyName
 *  ```js
 *    const LazyComponent = VueMfe.lazy('appName.propertyName')
 *  ```
 * @example 引入 workflow 下入口文件暴露出的 FlowLayout 组件，wf 为 appName，FlowLayout 为 portal.entry.js module 暴露出的变量
 *  ```js
 *    const FlowLayout = VueMfe.lazy('wf.components.FlowLayout')
 *  ```
 */
export default {
  name: 'AsyncComponent',
  components: {
    AsyncExample: () => VueMfe.Lazy('demo.components.Example')
  }
}
````

### version

`VueMfe.version: string` 当前版本号。

## DEMO

- [App](https://github.com/vuchan/vue-mfe/blob/master/example/root-app/src/main.js)
- [SubApp](https://github.com/vuchan/vue-mfe/blob/master/example/sub-app-demo/main.js)
- [Lazy](https://github.com/vuchan/vue-mfe/blob/master/example/sub-app-lazy/src/views/async.vue)

```bash
# pull repo
git clone https://github.com/vuchan/vue-mfe.git
cd vue-mfe

# 安装依赖
npm i

# 运行示例项目
npm run example
```
