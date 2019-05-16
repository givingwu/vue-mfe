---
lang: zh-CN
---

# 快速上手

+ [原理和项目架构](#项目架构)
+ [查看示例 demo](#demo)


## 项目架构
![macrocosmic-architecture-detail](/images/macrocosmic-architecture-detail.jpg)


### package-server
> 静态文件管理服务器。

+ 提供 domain-app 资源部署和上传/更新/回滚
+ 提供接口获取 master-runtime 所有子 domain 的配置和 JS chunks 及 umd 入口
+ 提供 socket 提示用户更新客户端代码


### master-runtime
> 主运行时项目，也可以称作基础、基座项目。

+ 通过 `VueMfe.createMasterRouter(config)` 注入主运行时路由，配置，钩子方法
+ 提供公共 布局、组件、插件、数据 `$store` 等供 domain-app 使用
+ 提供公共 登录、鉴权、校验 等公共逻辑供 domain-app 使用
+ 通过 CDN 引入 UMD 格式公共依赖，再在每个 domain-app 中使用相同的 externals，优化JS文件大小和构建速度


### [vue-mfe](README.md#how)

> 抽离的工具库，聚焦在增强 master-runtime 的全局路由以支持 [Micro Front-end](README.md#mfe)。

+ 提供中心化路由
+ 提供路由拦截
+ 提供资源懒加载器
+ 支持动态装载路由
+ 支持自定义 parentPath 注入路由(用于适配不同的layout)
+ 增强原始路由方法 router.helpers


### domain-app

> 每个不同的 domain 应用，即基于 master-runtime 的各个微应用。

+ build 成 [UMD](https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/) 格式供 master-runtime 引入 webpack unmanaged bundle。(因为 master-runtime 和 domain-app 是不同的 webpack-build-runtime)
+ build 的入口**必须是当前项目的路由**。 (因为该资源会被 `vue-mfe/lazyloader` 通过 UMD 的当前 namespace 的全局变量动态装载，命名空间模拟代码 namespace =>  `location.pathname.split('/').filter(Boolean)[0]`)
::: warning
路由的根路由必须以 `/${namespace}/` 开始，且 `${namespace}` 不能存在与另一 domain 的 namespace 重复，否则会抛出 `registerRoutes` 失败的错误
:::
+ 如果结合 [plugin](/plugin/) 需要在产品环境 **build** 时指定 **entry** 入口文件，若不使用 [plugin](/plugin/) 则参考 [Vue-CLI V3#build-targets](https://cli.vuejs.org/guide/build-targets.html#library) library 打包📦方式。


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
        <li><router-link :to="{ path: '/foo' }">domain-app foo</router-link></li>
        <li><router-link :to="{ path: '/bar/123' }">domain-app bar</router-link></li>
      </ul>
      <router-view class="view"></router-view>
    </div>
  `
}).$mount('#app')
```


#### [domain-app](#domain-app) foo `./domain/foo/index.js`:

```js
window.__domain__app__foo = (function() {
  const Foo = { template: '<div>This is Foo</div>' }
  const routes = [{ path: '/foo',  parentPath: '', name: 'foo', component: Foo }]

  return function(app) {
    return new Promise((resolve, reject) => {
      if (Math.random() > 0.5) {
        resolve(routes)
      } else {
        const msg = 'initialize domain-app foo failed'
        console.error(msg)
        reject(msg)
        throw new Error(msg)
      }
    })
  }
}())
```

#### [domain-app](#domain-app) bar `./domain/bar/index.js`:

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
将主运行时应用发布到仓库，供 [domain-app](#domain-app) 在开发时使用。

```bash
cd $HOME/Development/WorkSpace/master-runtime-project
npm publish --registry http://{yourPrivateNpmRepository}
```

#### [domain-app](#domain-app) 配置

+ 安装主运行时作为启动依赖
`npm install {master-runtime-name} --save`
+ 将 domain-app 的 [webpack entry](https://webpack.js.org/concepts/entry-points/) 修改为主运行时入口，[vue-cli3 修改 entry 的配置文档](https://cli.vuejs.org/config/#pages):
```js
module.exports = {
  configureWebpack: {
    entry: require('path').resolve('node_modules/{master-runtime-name}/src/main.js'),
  }
}
```

+ 在 domain-app 中启动项目：

```bash
npm run start
```

假设：domain-app 中有以下文件 `src/portal.entry.js`，则在本地启动后，访问路径`/portal/a` 时，如果在 master-runtime 项目路由表中不匹配该路由，则会调用 `router._config.getResource()` 方法并通过的 `vue-mfe/lazyloader` 懒加载该命名空间资源。

```js
{ [require('@root/package.json').name]: import('@/portal.entry.js') }
```
