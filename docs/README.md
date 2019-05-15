---
home: true
heroImage: /hero.png
actionText: 立即开始 →
actionLink: /guide/
features:
- title: MasterRouter
  details: 创建主路由以拦截未装载路由并调用 lazyloader 懒加载当前 domain 的路由资源，并动态注入到当前应用。
- title: addRoutes
  details: 重写 addRoutes 方法以支持搜索主路由并注入子路由、匹配特定的 parentPath 并重置 vue-router 内部的 `matcher`。
footer: MIT Licensed | Copyright © 2019-present vuchan
---


## Getting Started

HTML template with CDN:

```HTML
<!DOCTYPE html>
<link rel="stylesheet" href="/path/to/any.css">
<div id="app"></div>
<script src="https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router@3.0.6/dist/vue-router.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-mfe/dist/vue-mfe.js"></script>
```


Example:

```js
const Home = { template: '<div>This is Home</div>' }
const MasterRouter = VueMfe.createMasterRouter({
  // VueRouter 配置项
  mode: 'history',
  routes: [
    { path: '/', name: 'home', component: Home },
  ],
  // Vue-MFE 配置项
  onLoadStart(name) {}, // 加载开始时被调用 (name: String)
  onLoadSuccess(name) {}, // 加载成功时被调用 (name: String)
  onLoadError(error, next) {}, // 加载失败时被调用 (error: Error, next: Function)
  getResource() { // 获取需要所有需懒加载的路由入口 JS 文件时被 lazyloader 内部调用
    return {
      'foo': '/path/to/foo/entry.umd.js',  // `/foo/*` foo 的资源入口
      'bar': '/path/to/bar/entry.umd.js',  // `/foo/*` foo 的资源入口
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
      <h1>Named Routes</h1>
      <p>Current route name: {{ $route.name }}</p>
      <ul>
        <li><router-link :to="{ name: 'home' }">home</router-link></li>
        <li><router-link :to="{ name: 'foo' }">domain-app foo</router-link></li>
        <li><router-link :to="{ name: 'bar', params: { id: 123 }}">domain-app bar</router-link></li>
      </ul>
      <router-view class="view"></router-view>
    </div>
  `
}).$mount('#app')
```
