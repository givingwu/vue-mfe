const Home = { template: '<div>This is Home</div>' }

// 创建主路由
const MasterRouter = VueMfe.createMasterRouter({
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
      'bar': './domain/bar/index.js',  // `/foo/*` foo 的资源入口
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
        <li><router-link :to="{ path: '/foo' }">domain-app foo</router-link></li>
        <li><router-link :to="{ path: '/bar', params: { id: 123 }}">domain-app bar</router-link></li>
      </ul>
      <router-view class="view"></router-view>
    </div>
  `
}).$mount('#app')