---
title: 介绍
lang: zh-CN
meta:
  - name: description
    content: VUE-MFE 快速上手
  - name: keywords
    content: vue, vue-mfe, VUE-MFE
---

# MFE
MFE 是 micro front-end 的缩写，即**微前端**，对于**微前端**以下文章中有全面的分析：

+ [Micro-FrontEnds](https://micro-frontends.org/)
+ [微前端的那些事儿](https://github.com/phodal/microfrontends)
+ [中台微服务了，那前端呢？](https://mp.weixin.qq.com/s/hke92257-EB1ksrV6tb-mg)
+ [用微前端的方式搭建类单页应用](https://tech.meituan.com/2018/09/06/fe-tiny-spa.html)


## 社区实现

社区的实现(Community implementations)，Framework Support & Projects Table:

| all                                     | vue                                          | react                                                                                 | angular                                |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| [single-spa](https://single-spa.js.org) | [vue-mfe](https://github.com/vuchan.vue-mfe) | [feature-hub](https://feature-hub.io)                                                 | [mooa](https://github.com/phodal/mooa) |
|                                         | [frint.js](https://frint.js.org)             | [frint.js](https://frint.js.org)                                                      |                                        |
|                                         |                                              | [react-universal-component](https://github.com/faceyspacey/react-universal-component) |                                        |


## What?
`vue-mfe` 是一个用于快速创建基于 vue.js 微前端 SPA 的 JavaScript 库。


## Why?
围绕 [Vue.js](https://vuejs.org/) 技术栈定制实现，无任何重复依赖。


## How?

### V1.0.0+

+ 基于事件驱动设计
+ 支持预安装和懒加载
+ 增强 [vue-router](http://router.vuejs.org) 功能
+ 支持动态添加路由及嵌套路由

## How?

### v1.0.0+
![vue-mfe-architecture-v1](/images/vue-mfe-architecture-v1.jpg)

1. domain-app 将 routes 作为 webpack build 时候的入口并打包成 UMD 格式，暴露一个 当前 domain 路由的全局变量到全局作用域
2. 当应用在访问`/prefix` 路由的时候如果是个未注册路由，则调用 `config.getResource()` 获取当前 domain 的资源后加载当前 domain 的资源，并动态安装当前 domain 暴露的全局变量路由，安装成功后 `next` 即完成

### v1.1.0+

![vue-mfe-architecture-v1.1](/images/vue-mfe-base.jpeg)

+ 重写核心函数
+ 重新整理项目结构
+ 更新 API => `Vue.createApp`, `Vue.createSubApp`
+ 新增 `Lazy` 方法 => `Vue.Lazy`


## installation

### use CDN

```html
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-router/dist/vue-router.js"></script>
<script src="https://cdn.jsdelivr.net/npm/vue-mfe/dist/vue-mfe.js"></script>
```

### 安装指南

#### yarn
```bash
yarn add vue-mfe -S
```

#### npm
```bash
npm install vue-mfe --save
```
