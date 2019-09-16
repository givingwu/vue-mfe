<p align="center"><a href="https://vuchan.github.io/vue-mfe" target="_blank" rel="noopener noreferrer"><img width="200" src="./docs/.vuepress/public/images/mfe-logo.png" alt="VueMfe logo"></a></p>

<p align="center">
  <a href="https://npmcharts.com/compare/vue-mfe?minimal=true"><img src="https://img.shields.io/npm/dm/vue-mfe.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/vue-mfe"><img src="https://img.shields.io/npm/v/vue-mfe.svg" alt="Version"></a>
  <a href="https://github.com/996icu/996.ICU/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-Anti%20996-blue.svg" alt="License"></a>
  <br>
</p>



# VueMfe

✨ A JavaScript library for Vue.js micro front-end(App) solution.

```bash
___________
| | |__ |__
| | |   |__
```


## FEATURES
+ Support dynamically add child routes to an existing route & nested route.
+ Support preinstall or lazyload a sub-app & nested sub-app.
+ Support load a component remotely


## How?
<img width="100%" src="./docs/.vuepress/public/images/vue-mfe-architecture-v1.jpg" alt="VueMfe logo">


### MASTER-RUNTIME
```js
import router from '@@/router/index'
import { createApp } from 'vue-mfe'

// 主运行时
/** @type {VueComponent & VueMfeApp} */
export default createApp(/** @type {VueRouter} */router)
```


### SUB-APP
```js
import routes from './router/routes.js'
import { createSubApp } from 'vue-mfe'

export default createSubApp({
  // 必选，需要被拦截的子应用路由前缀
  /** @type {string}  */
  prefix: 'demo', // '/demo'

  // 必选，需要被动态注入的子应用路由数组
  /** @type {RouteConfig[]} */
  routes,

  // 可选，子应用的中文名称
  /** @type {string}  */
  name: '示例',
})
```


### LAZY-LOAD
```js
import VueMfe from 'vue-mfe'

// if use it without called method `VueMfe.createApp(config: AppConfig)`
VueMfe.setConfig({
  resources: {
    a: 'a.umd.js', // window.a = { components: { example: { render: () => <h1>'Hello, World!'</h1> } } }
    b: 'b.umd.js'
  }
})

VueMfe.lazy('a.components.example')
```


## API

+ `VueMfe.createApp({}: AppConfig)` 创建主应用
```js
// 主运行时
/** @type {VueComponent & VueMfeApp} */
export default createApp(/** @type {VueRouter} */router, {
  // 是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
  /** @type {boolean} */
  sensitive: false,

  // 默认的 parentPath => router.addRoutes(routes, parentPath)
  /** @type {string} */
  parentPath: '/',

  // 获取资源的配置函数/对象，支持同步/异步
  /** @type {Object|Function} */
  resources: () => {},
})
```

+ `VueMfe.createSubApp({}: SubAppConfig)` 创建子应用

```js
export default VueMfe.createSubApp({
  // 必选，需要被拦截的子应用路由前缀
  /** @type {string}  */
  prefix: 'demo',

  // 必选，需要被动态注入的子应用路由数组
  /** @type {RouteConfig[]} */
  routes,

  // 可选，子应用的中文名称
  /** @type {string}  */
  name: '示例',

  // 可选，子应用默认的父路径/布局
  parentPath: '/',
  // 可选，子应用的 resources 配置项

  /** @type {string[]}  */
  resources: ['main.xxxxxxx.css', 'demo.xxxx.umd.js', 'demo.xxxx.umd.js'],

  // 可选，子应用的初始化方法
  /** @type {() => void|Promise<T>} init function */
  init: () => {},

  // 可选，子应用暴露出的组件。后续可通过 `Vue.Lazy('prefix.components.componentName')` 访问到子应用所暴露的对应组件。
  /** @type {Object<string, Function|Object>} */
  components: {
    example: () =>
      import('./components/example'),
  },
})
```

+ `VueMfe.Lazy(path: string)` 懒加载模块或者组件
+
```js
// 加载 demo 子应用的 components 下 example 组件
VueMfe.Lazy('demo.components.example')
```



## TODO
+ [ ] unit test cases
+ [x] deploy docs by vuepress
+ [x] publish package to npm registry


## Troubleshooting

> This needs to be changed if multiple webpack runtimes (from different compilation) are used on the same webpage. Does anyone know how to resolve it?

  + [Multiple Webpack entry points loaded](https://github.com/webpack/webpack/issues/2112)
  + [Dynamic require breaks when using more than one webpack bundle at the same time] (https://github.com/webpack/webpack/issues/3791)
  + [在同一个页面中加载多个 webpack 实例](https://github.com/zh-rocco/fe-notes/issues/1)
  + [How can I combine two completely separate bundles using dynamic bundling?](https://stackoverflow.com/questions/42450048/webpack-how-can-i-combine-two-completely-separate-bundles-using-dynamic-bundlin)
  + [hosting-multiple-react-applications-on-the-same-document](https://medium.jonasbandi.net/hosting-multiple-react-applications-on-the-same-document-c887df1a1fcd)
