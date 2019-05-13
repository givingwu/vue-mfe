---
lang: zh-CN
---

# 快速上手

+ 直接查看[示例 demo](#demo)
+ 了解原理和[项目架构](#项目架构)

## 项目架构
![macrocosmic-architecture-detail](/images/macrocosmic-architecture-detail.jpg)

### package-server
> 静态文件管理服务器。

+ 提供 domain-app 资源部署和上传/更新/回滚
+ 提供接口获取 master-runtime 所有子 domain 的配置和 JS chunks 及 umd 入口
+ 提供 socket 提示用户更新客户端代码

### master-runtime
> 主运行时项目，也可以称作基础、基座项目。

+ 通过 `vue-mfe` 注入主运行时路由，配置，和钩子方法
+ 提供公共 布局、组件、插件、数据`$store` 供子 domain-app 使用
+ 提供公共 登录、鉴权、校验 之类的通用业务逻辑  供子 domain-app 使用
+ 产品环境将通过 CDN 引入 UMD 公共依赖，再在每个 domain-app build 的时候 external，以优化JS文件大小

### [vue-mfe](README.md#how)
> 抽离的工具库，聚焦在增强 master-runtime 的全局路由以支持 [MFE](README.md#mfe)。

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

### [master-runtime](#master-runtime)配置

#### 替换路由

替换 router 成 vue-mfe 的 `createMasterRouter`，以建立中心化路由响应机制。

<<< @/src/router/index.js{6,15,35,36}

#### 发布应用
将主运行时应用发布到仓库，供 [domain-app](#domain-app) 在开发时使用。

```bash
cd $HOME/Development/WorkSpace/master-runtime-project
npm publish --registry http://{yourPrivateNpmRepository}
```

### [domain-app](#domain-app)配置

+ 安装主运行时作为启动依赖
`npm install {master-runtime-name} --save`
+ 将 domain-app 的 [webpack entry](https://webpack.js.org/concepts/entry-points/) 修改为主运行时入口，[vue-cli3 修改 entry 的配置文档](https://cli.vuejs.org/config/#pages):
```js
module.exports = {
  pages: {
    index: {
      entry: 'node_modules/{master-runtime-name}/src/main.js',
    },
  },
}
```

+ 在 domain-app 中启动项目：

```bash
npm run start
```

因为这里 webpack 入口指向了 `node_modules/{master-runtime-name}/src/main.js`，而 domain-app 中被依赖的入口则是它的路由文件。在 `node_modules/{master-runtime-name}/src` 中 `../../` 则回到了当前项目级 `path`。

下面配置表示：在 `master-runtime` 中引入路由的命名空间 `[key]` 默认取 package.json 中的 `name` 字段，值默认是 domain-app 的本地路由入口文件 `@/portal.entry.js`，参见 [DEMO getResource()](#替换主运行时路由)。

```js
{ [require('../../package.json').name]: import('@/portal.entry.js') }
```

假设：domain-app 中有以下路由文件 `src/portal.entry.js`，则在本地启动后，访问路径`/portal/a` 时，如果在master-runtime项目路由表中不匹配该路由，则会调用 `router._config.getResource()` 方法并通过的 `vue-mfe/lazyloader` 懒加载该命名空间资源。
