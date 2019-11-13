---
title: 写法约定
lang: zh-CN
meta:
  - name: description
    content: VUE-MFE 写法约定
  - name: keywords
    content: vue, vue-mfe, VUE-MFE
---

# 写法约定

## master-runtime

+ 在 主运行时 项目中 `/master-runtime-project/.env` 文件中需要声明 `VUE_APP_MASTER=true` 以让 vue-mfe 理解当前项目是 master-runtime

<<< @/.env

+ 将 主运行时 的 `router` 替换成 `vue-mfe/createMasterRouter` 以监听并懒加载 unmatched route ，且 `createMasterRouter(config)` 中的 `config.getResource` 方法可根据不同的模式和环境做的不同的匹配


## SubApp
+ SubApp 的 webpack entry 入口由原先的 `src/main.js` 改为 master-runtime 的 `getResource` 中配置的本地开发环境入口。
+ SubApp 中原先 main.js 中的无副作用的初始化方法都要放进路由入口。
+ SubApp 的 **默认路由入口** 是 `src/portal.entry.js`。
+ SubApp 应该保持“**纯净**”且“**无副作用**”，**不侵入**任何 master-runtime 或其他 domain 逻辑，仅被支持的“外部状态”来自 master-runtime 中 Vuex 往下暴露的 `this.$store`。

假设应用 SubApp-a 有以下目录结构:
```
/src
  /common
    -CONSTANTS.js
  /components
    -Spinner.vue
    -GlobalSpinner.js
  /router
    -routes.js
  /mixins
  -main.js // 应用入口
  -portal.entry.js // SubApp 入口
```

### BAD
> SubApp 业务级的方法不应该影响全局状态

/src/portal.entry.js
```js
import Vue from 'vue'
import CONSTANTS from './common/CONSTANTS'
import routes from './router/routes'

// 注入全局依赖后如果另一个 SubApp-b 也存在这样的赋值声明逻辑，则产生了冲突
Vue.prototype.CONSTANTS = CONSTANTS

export default routes
```

### GOOD
> 在每个使用到 CONSTANTS 的业务中，可以使用Vue实例的 { mixins: [withConstants] } 以保持全局状态的纯净

/src/mixins/withConstants.js
```js
import CONSTANTS from './common/CONSTANTS'

export default {
  data() {
    $CONSTANTS: CONSTANTS
  }
}
```

/src/components/GlobalSpinner.js
```js
import Spinner from '../Spinner'
import withConstants from '@/mixins/withConstants'

export {
  mixins: [withConstants],
  created() {
    console.log(this.$CONSTANTS)
  },
  render () {
    //...
  }
}
```


## 强约定
+ SubApp 的 **namespace** 必须唯一(namespace 默认是 `require('../package.json').name`)
+ SubApp 的 **namespace** 必须同 built 的 UMD 暴露出来的全局变量一致
+ SubApp 的 **路由 path 和 name** 必须以 namespace 开始以避免重复冲突导致路由动态注入失败

## 示例

SubApp 目录下 `package.json` 的 name 是 `portal`：
```json
// package.json
{
  "name": "portal" // ...
}
```

+ 则 SubApp 的 namespace 是 `portal`
+ [webpack output](https://webpack.js.org/configuration/output/) built 之后的 umd `portal.umd.js` 暴露出的全局变量也必须是 `portal`

```js
// vue.config.js
module.exports = {
  output: {
    library: {
      root: 'portal', // for Browser
      amd: 'portal-app',
      commonjs: 'portal-app',
    },
    libraryTarget: 'umd', // UMD format
    filename: 'js/portal-[chunkhash:8].umd.js',
  },
}
```

+ 根路由 `path` 从 `/` redirect 到 `/portal`
+ 所有路由 `name` 都以 `portal` 开始

```js{5,8,9,21,28}
// 路由文件 `src/portal.entry.js`，根据以上约定：
export default [
  process.env.NODE_ENV === 'development' && {
    path: '/',
    redirect: '/portal',
  },
  {
    path: '/portal', // 根路由 '/' => `/${namespace}`
    name: 'portal.main', // 路由 name: name => `${namespace}-${name}`
    redirect: '/portal/a',
    component: {
      render() {
        return <router-view></router-view>
      },
    },
    children: [
      {
        path: 'a', // child path 一定不能以 '/' 开始,
        // Note that nested paths that start with `/` will be treated as a root path.
        // This allows you to leverage the component nesting without having to use a nested URL.
        name: 'portal.pageA',
        /* https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c */
        component: () =>
          import(/* webpackPrefetch: true, webpackChunkName: "portal-a-page" */ '../views/Home.vue'),
      },
      {
        path: 'b',
        name: 'portal.pageB',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        /* https://medium.com/webpack/link-rel-prefetch-preload-in-webpack-51a52358f84c */
        component: () =>
          import(/* webpackPrefetch: true, webpackChunkName: "portal-b-page" */ '../views/About.vue'),
      },
    ],
  },
].filter(Boolean)
```
