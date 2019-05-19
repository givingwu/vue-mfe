import Vue from 'vue'
import MasterRouter from './router'
import mfe from './mfe'

if (!mfe.isInstalled('foo')) {
  mfe.preinstall('foo').then(() => {
    // eslint-disable-next-line
    console.log('isInstalled:', mfe.isInstalled('foo')); // true

    // does path exist or not
    if (mfe.helpers.pathExists('/foo')) {
      // eslint-disable-next-line
      console.log('/foo route:', mfe.helpers.findRoute('/foo')) /* findRoute(path: string) */

      if (!mfe.helpers.pathExists('/foo/dynamic')) {
        /* add route dynamic with parentPath and exists route */
        mfe.addRoutes([{
          path: '/dynamic',
          parentPath: '/foo',
          component: {
            template: '<h2>i am /foo/dynamic page</h2>'
          }
        }])
      }
    }
  })
}

new Vue({
  router: MasterRouter,
  methods: {
    addDynamicRoute() {
      mfe.addRoutes([{
        path: '/dynamic',
        component: {
          template: '<h2>i am /dynamic page</h2>'
        }
      }], '/')
    }
  },
  template: `
    <div id="app">
      <h1>Vue-MFE Demo</h1>
      <p>Current route name: {{ $route.name }}</p>
      <ul>
        <li><router-link :to="{ name: 'home' }">home</router-link></li>
        <li><router-link :to="{ path: '/foo' }">preinstalled domain-app foo</router-link></li>
        <li><router-link :to="{ path: '/bar/123' }">lazyload domain-app bar with initialize function</router-link></li>
      </ul>
      <router-view class="view"></router-view>

      <div>
        <p>Go to path <router-link :to="{ path: '/foo/dynamic' }">/foo/dynamic</router-link></p>
        <p>
          The path <router-link :to="{ path: '/dynamic' }">/dynamic</router-link> does not exist in current router.
          click to <button @click="addDynamicRoute">Dynamically add child routes to an existing path '/'</button>,
          go to <router-link :to="{ path: '/dynamic' }">/dynamic</router-link>.
        </p>
      </div>
    </div>
  `
}).$mount('#app')
