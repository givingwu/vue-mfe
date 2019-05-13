---
title: 路由增强特性
lang: zh-CN
meta:
  - name: description
    content: VUE-MFE 路由增强特性
  - name: keywords
    content: vue, vue-mfe, VUE-MFE
---

# 路由增强
![enhanced-router](/images/enhanced-router.jpg)


## 新增属性

`_config`: master-runtime 在调用 `vue-mfe/createMasterRouter` 创建全局的 GlobalPageRouter 时使用的 `{ routes, ...config }` config。

`helpers`: 挂载了 `vue-mfe/helpers/routeHelpers` 中提供的一些快捷工具方法。


### 新增方法

+ `router.addRoutes(route: Array<RouteConfig>, prependPath ?: string)`: router 实例属性，不用再调用原型链上的 `addRoutes` 方法。[参见 Vue-Router 的实现](https://github.com/vuejs/vue-router/blob/dev/src/index.js#L222)。
  + 增加了 route.parentPath 的支持，选中**特定的 parentPath** 并动态写入
  + 默认**动态路由**都 push 到根路由 '/' 的 children 集合中
+ `router.helpers.completePath(path: string, parentPath?: string): string)`：拼接并返回完整路径。
+ `router.helpers.findPathName(path: string): string`：根据给出路径找到路径的 name
+ `router.helpers.findRoute(routes: Array<RouteConfig>， matchPath: string)：string` 深度优先递归遍历 routes 找到匹配 matchPath 的 Route
+ `router.helpers.pathExists(path: string): boolean`：根据给出路径判断路径是否已在路由表中存在
+ `router.helpers.nameExists(name: string): boolean`：根据给出 name 判断 name 是否已在路由表中存在
