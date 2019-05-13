---
home: true
heroImage: /hero.png
actionText: 立即开始 →
actionLink: /guide/
features:
- title: Master Router
  details: 提供 `createMasterRouter` 方法创建主路由，并拦截未装载路由调用 `lazyloader`。
- title: Lazyloader
  details: 提供 `lazyloader` 通过 `getResource` 方法懒加载当前 namespace 的路由，并动态注入到当前应用。
- title: addRoutes
  details: 提供 `router.addRoutes` 方法动态添加 `routes` 到 `masterRouter` 主路由，并重置 vue-router 内部的 `matcher`。
footer: MIT Licensed | Copyright © 2019-present vuchan
---
