# VueMfe

A JavaScript library for Vue micro front-end solution.


## New API

Master-runtime:
```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMfe from 'vue-mfe'

Vue.use(VueRouter)
const router = new VueRouter({ routes: [], mode: 'history' })

// Vue.use(VueMfe, { ignoreCase: true })

const MFE = new VueMfe({
  router,
  ignoreCase: true,
  defaultParentPath: '/',
  getNamespace: (name) => `__domain__app__${name}`,
  getResource: () => {}
})

// load start
MFE.on('start', (name) => {})

// load success
MFE.on('end', (name) => {})

// load error
MFE.on('error', (error, name) => {})
```


## MASTER-RUNTIME
+ 中心化路由
+ 动态注入嵌套路由
+ 重置路由 `matcher`

## DOMAIN-APPLICATION
