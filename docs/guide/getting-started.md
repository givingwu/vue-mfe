---
lang: zh-CN
---

# 快速上手

+ [原理和项目架构](#项目架构)
+ [查看示例 demo](#demo)


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

<!-- ### package-server
> 静态文件管理服务器 or Your CDN Server address。

+ 支持 SubApp 资源部署和上传/更新/回滚
+ 支持获取 master-runtime 所有 SubApp 的入口依赖文件
+ 支持提示用户更新客户端代码当存在更新时 -->


### master-runtime
> 主运行时项目，即基座项目。

+ 通过 `VueMfe.createApp(config)` 注入主路由，配置，钩子方法
+ 提供公共 布局、组件、插件、数据 `$store` 等供 SubApp 使用
+ 提供公共 登录、鉴权、校验 等公共逻辑供 SubApp 使用


::: tip **如何处理公共依赖？**
通过 CDN 引入 UMD 格式处理公共依赖，再在每个 SubApp 中使用相同的 externals，以优化JS文件大小和构建速度(因为SubApp 运行在 master-runtime 中)。
:::

### [vue-mfe](README.md#how)

> 抽离的工具库，聚焦在增强 master-runtime 的全局路由实例`this.$root.$router`以支持 [Micro Front-end](README.md#mfe)。

+ 提供中心化路由的 `beforeHook` 拦截
+ 提供资源懒加载器 `loader`
+ 支持动态装载路由 `addRoutes(routes: RouteConfig[], parentPath?: string)`
+ 提供远程模块加载 `VueMfe.Lazy(SubAppName.moduleName.propertyName)`


### SubApp

> 基于 master-runtime 的各个微应用。

+ build 成 [UMD](https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/) 格式供 master-runtime 引入 webpack unmanaged bundle。
::: tip
子应用打包成 UMD 格式的主要原因是为了维护一个统一的 webpack build context。主运行时在 PRD 上跑的是 webpack 构建后的bundle 代码，而子应用也支持被独立构建，那么变成了两个独立的 webpack build context 构建生成的 bundle。当时没有找到好的解决办法，所有用 UMD 上了。而后续在写 `VueMfe.Lazy` 的时候看到了社区有一种实现方式是使用 XHR 把 JS 文件请求到后使用 `new Function(require, exports, ${ XHRResponse.bodyText })` 拼接后执行。类似这样[httpVueLoader ScriptContext.compile](https://github.com/FranckFreiburger/http-vue-loader/blob/master/src/httpVueLoader.js#L161)。
:::
+ build 的入口**必须是执行 `VueMfe.createApp`的文件**。 (因为该资源会被 [vue-mfe/src/helpers/loader.js](https://github.com/vuchan/vue-mfe/blob/master/src/helpers/loader.js#L57) 通过 UMD 的暴露的全局变量动态装载。
::: warning
路由的根路由必须以 `/${namespace}/` 开始，且 `${namespace}` 不能存在与另一 domain 的 namespace 重复，否则会抛出 `registerRoutes` 失败的错误
:::


## DEMO

分别展示不使用构建工具和使用时的代码，使用构建工具会增加一定的学习曲线，但是有谁不喜欢构建工具呢？


### 无构建工具

#### HTML template with CDN:

```HTML
<!DOCTYPE html>
<link rel="stylesheet" href="/path/to/any.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@3.0.6/dist/vue-router.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-mfe/dist/vue-mfe.js"></script>
```


#### [master-runtime](#master-runtime) **home**:

```js
var Home = { template: '<div>This is Home<div><router-view></router-view></div></div>' }
// 创建主路由
var MasterRouter = VueMfe.createMasterRouter({
  // VueRouter 配置项
  mode: 'hash',
  base: '/',
  routes: [
    { path: '/', name: 'home', component: Home },
  ],
  // Vue-MFE 配置项
  onLoadStart(name) {}, // 加载开始时被调用 (name: String)
  onLoadSuccess(name) {}, // 加载成功时被调用 (name: String)
  onLoadError(error, next) {}, // 加载失败时被调用 (error: Error, next: Function)
  async getResource() { // 获取需要所有需懒加载的路由入口 JS 文件时被 lazyloader 内部调用
    return await {
      'foo': './domain/foo/index.js',  // `/foo/*` foo 的资源入口
      'bar': './domain/bar/index.js',  // `/bar/*` bar 的资源入口
    }
  },
  getNamespace(name) { // umd 全局变量的命名空间规则
    return `__domain__app__${name}`
  }
})

new Vue({
  router: MasterRouter,
  template: `
    <div id="app">
      <h1>Vue-MFE Demo</h1>
      <p>Current route name: {{ $route.name }}</p>
      <ul>
        <li><router-link :to="{ name: 'home' }">home</router-link></li>
        <li><router-link :to="{ path: '/foo' }">SubApp foo</router-link></li>
        <li><router-link :to="{ path: '/bar/123' }">SubApp bar</router-link></li>
      </ul>
      <router-view class="view"></router-view>
    </div>
  `
}).$mount('#app')
```


#### [SubApp](#SubApp) foo `./domain/foo/index.js`:

```js
window.__domain__app__foo = (function() {
  const Foo = { template: '<div>This is Foo</div>' }
  const routes = [{ path: '/foo',  parentPath: '', name: 'foo', component: Foo }]

  return function(app) {
    return new Promise((resolve, reject) => {
      if (Math.random() > 0.5) {
        resolve(routes)
      } else {
        const msg = 'initialize SubApp foo failed'
        console.error(msg)
        reject(msg)
        throw new Error(msg)
      }
    })
  }
}())
```

#### [SubApp](#SubApp) bar `./domain/bar/index.js`:

```js
window.__domain__app__bar = (function() {
  const Bar = { template: '<div>This is Bar {{ $route.params.id }}</div>' }
  const routes = [{ path: '/bar/:id', parentPath: '', name: 'bar', component: Bar }]

  return routes
}())
```


### 使用 webpack 构建

#### [master-runtime](#master-runtime)配置

替换 router 成 vue-mfe 的 `createMasterRouter`，以建立中心化路由响应机制。

<<< @/src/router/index.js{4}

##### 发布应用
将主运行时应用发布到仓库，供 [SubApp](#SubApp) 在开发时使用。

```bash
cd $HOME/Development/WorkSpace/master-runtime-project
npm publish --registry http://{yourPrivateNpmRepository}
```

#### [SubApp](#SubApp) 配置

+ 安装主运行时作为启动依赖
`npm install {master-runtime-name} --save`
+ 将 SubApp 的 [webpack entry](https://webpack.js.org/concepts/entry-points/) 修改为主运行时入口，[vue-cli3 修改 entry 的配置文档](https://cli.vuejs.org/config/#pages):
```js
module.exports = {
  configureWebpack: {
    entry: require('path').resolve('node_modules/{master-runtime-name}/src/main.js'),
  }
}
```

+ 在 SubApp 中启动项目：

```bash
npm run start
```

假设：SubApp 中有以下文件 `src/portal.entry.js`，则在本地启动后，访问路径`/portal/a` 时，如果在 master-runtime 项目路由表中不匹配该路由，则会调用 `router._config.getResource()` 方法并通过的 `vue-mfe/lazyloader` 懒加载该命名空间资源。

```js
{ [require('@root/package.json').name]: import('@/portal.entry.js') }
```
