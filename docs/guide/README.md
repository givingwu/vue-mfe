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
MFE 是英文 micro front-end 的缩写，即**微前端**，对于**微前端**以下文章中有全面的分析：

+ [微前端的那些事儿](https://giethub.com/phodal/microfrontends)
+ [美团-用微前端的方式搭建类单页应用](https://tech.meituan.com/2018/09/06/fe-tiny-spa.html)
+ [中台微服务了，那前端呢？](https://mp.weixin.qq.com/s/hke92257-EB1ksrV6tb-mg)

## communities implementations

Framework Support & Project Name Table:

| all                                     | vue                                          | react                                                                                 | angular                                |
| --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------- |
| [single-spa](https://single-spa.js.org) | [vue-mfe](https://github.com/vuchan.vue-mfe) | [feature-hub](https://feature-hub.io)                                                 | [mooa](https://github.com/phodal/mooa) |
|                                         | [frint.js](https://frint.js.org)             | [frint.js](https://frint.js.org)                                                      |                                        |
|                                         |                                              | [react-universal-component](https://github.com/faceyspacey/react-universal-component) |                                        |


# What?
`vue-mfe` 是一个用于快速创建基于 vue.js 微前端 SPA 的 JavaScript 库。

## Why?

围绕 [Vue.js](https://vuejs.org/) 技术栈实现，无任何重复依赖，核心代码不超过 400 行。

+ 非常简单的 API
+ 无任何侵入式代码
+ 动态注入嵌套路由
+ 懒加载子域名资源

## How?
![vue-mfe-architecture](/images/vue-mfe-architecture.jpg)

1. 通过 vue-mfe 对外暴露的`createMasterRouter(config)`方法在[主运行时](getting-started.md#master-runtime)(master-runtime)中声明主路由
2. 而在 `createMasterRouter` 方法内部调用了 `createPageRouter` => `createRouterInterceptor` 注入 before-hook 拦截判断 `to.path` 是否 `matched`
3. 如果**不匹配**则理解为一个需要懒加载的路由，开始调用 `config.getResource()` 方法**动态请求资源**
4. 请求资源成功后通过 `installScripts` 串行 `lazyloadScript` 注入到当前页面上下文
::: tip
   由于是不同的 webpack-build-runtime 所以 domain-app 对 master-runtime 来说是 [webpack unmanaged bundle](README.md#webpack-unmanaged-bundle)，这里暂时用了 [UMD](https://www.davidbcalhoun.com/2014/what-is-amd-commonjs-and-umd/) 的打包格式来处理，这并不是最好的方案，后续找到更好的方案会优化。
:::
5. 注入完 UMD 格式的 script 之后会拿到当前 domain-app `export` 出来的路由，再调用 `installModule` **动态注入路由**
6. 注入路由会**校验**、**去重**相同的 path 和 name，注册完成后调用 `next(to)` 完成闭环。


## installation

首先将 path 在 terminal 中切到当前项目。

### 内网用户

配置当前项目的 npmrc:

```bash
touch .npmrc
vim .npmrc
```

复制并粘贴如下内容：

<<< @/.npmrc

`:wq` 退出即可

### 安装指南

仅[主运行时](getting-started.md#master-runtime)需要安装 `vue-mfe`，而 [domain-app](getting-started.md#domain-app) 直接安装`master-runtime`即可。

### 主运行时

#### yarn
```bash
yarn add vue-mfe -S
```

#### npm
```bash
npm install vue-mfe --save
```

#### cnpm
```bash
cnpm i --registry=http://172.16.0.132:18081/repository/npm
```


### domain-app

在内网仓库中 `ibuild-portal-lte`，是我们团队的主运行时项目。所以在 domain 应用中，需要安装它并且更改 vue.config.js 的 `entry`。

#### yarn
```bash
yarn add ibuild-portal-lte -S
```

#### npm
```bash
npm install ibuild-portal-lte --save
```

## webpack unmanaged bundle

> This needs to be changed if multiple webpack runtimes (from different compilation) are used on the same webpage.

+ 如何解决不同的 webpack runtime 引入多个不同 entry?
  + [Multiple Webpack entry points loaded](https://github.com/webpack/webpack/issues/2112)
  + [Dynamic require breaks when using more than one webpack bundle at the same time](https://github.com/webpack/webpack/issues/3791)
+ How can I combine two completely separate bundles using dynamic bundling?
  + [stack overflow](https://stackoverflow.com/questions/42450048/webpack-how-can-i-combine-two-completely-separate-bundles-using-dynamic-bundlin)
  + [medium](https://medium.jonasbandi.net/hosting-multiple-react-applications-on-the-same-document-c887df1a1fcd)
