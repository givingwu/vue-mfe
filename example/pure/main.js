// import Vue from 'vue'
// import VueRouter from 'vue-router'
// import VueMfe from '../../dist/vue-mfe.esm.browser'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: {
      template: '<div>This is Home<div><router-view></router-view></div></div>'
    }
  },
]

// 创建主路由
const MasterRouter = new VueRouter({ routes })

// eslint-disable-next-line
const MasterRuntime = new VueMfe({
  // routes,
  router: MasterRouter,
  ignoreCase: true,
  parentPath: '/',
  getNamespace: (name) => `__domain__app__${name}`,
  async getResource () {
    return await {
      bar: ['./domain-app/test.js', './domain-app/bar/umd.js'],
      foo: ['./domain-app/test.js', './domain-app/foo/umd.js']
    }
  }
});

// eslint-disable-next-line
console.log('VueMfe: ', MasterRuntime);

// load start
MasterRuntime.on('start', ({ name }) => {
  // eslint-disable-next-line no-console
  console.log(`Load ${name} start`);
});

// load success
MasterRuntime.on('end', ({ name }) => {
  // eslint-disable-next-line no-console
  console.log(`Load ${name} success`);
});

// load error
MasterRuntime.on('error', (error, { name }) => {
  // eslint-disable-next-line no-console
  console.error(error, name);
});


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
