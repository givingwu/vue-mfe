# VueMfe RFC

## New API

Master-runtime:
```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import VueMfe from 'vue-mfe'

Vue.use(VueRouter)
const router = new VueRouter({ routes: [], mode: 'history' })

Vue.use(VueMfe, router, {})
```


## MASTER-RUNTIME
+ 中心化路由
+ 动态注入嵌套路由
+ 重置路由 `matcher`

## DOMAIN-APPLICATION
