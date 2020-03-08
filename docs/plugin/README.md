---
title: 介绍
lang: zh-CN
meta:
  - name: description
    content: vue-cli-plugin-mfe
  - name: keywords
    content: vue, vue-mfe, VUE-MFE, vue-cli-plugin-mfe
---

:::danger
暂时仅对内部开放，PS: 之前的 git 记录中有代码
:::

# vue-cli-plugin-mfe

为 vue-mfe 的 SubApp 量身打造的 Vue-CLI3 插件.

## FEATURES

### 可选的主运行时

支持可选的 `master-runtime` 配置，并根据是否选择 master 的配置生成相应的 `alias` 和 `entry`

### 自动配置 linters

集成 `eslint-standard`, `eslint-prettier`, `prettier/standard`, `prettier/vue`, `style-lint`, `vue-config` 等自动 lint 工具，无需再耗费心里手动维护配置依赖和规则

### friendly alias

根据 `aliases.config.js` 自动生成 VSCode friendly `jsconfig.json` 方便别名跳转 peek，无需手动去寻找/记住别名定义

### vue-cli-service package

`SubApp` 专属的打包命令，与原先的 `build` 命令做的事情非常类似。

- 更改 package 时候的 webpack entry 和 plugins，以 `['./src/portal.entry.js', './src/routes', './src/router/routes.js', './src/routes.js', './src/main.js']` 为基础自动探测在执行 `package` 时 `webpack` 依赖的入口 `entry`。
- 集成 `webpack-require-from` 指定 domain runtime 的 CDN `download` 主机地址
- 集成 `webpack-manifest-plugin` 收集版本和 built 之后的文件信息
- 集成 `node-archiver` 打成 `tar` 包并上传到指定的 `host`
- 自动压缩打包 📦 文件成 `.tar.gz` 并上传到指定 package-server.

## API

查看用法:

```bash
npx vue-cli-service help package
```

Terminal output:

```bash
Usage: vue-cli-service package [options]

Options:

  --upload-url         specify package-server API url to upload bundled files
  --download-url       specify package-server API url to download static files
  --disable-source-map disable source map. default: false
  --output-path        specify the output path of bundled files? default: package => /Users/vuchan.c.wu/Development/WorkSpace/ibuild-wf/ibuild-wf-portal/frontend/package
```

## RUN

`package` - 打包 SubApp 成 微前端应用 的命令。

```bash
vue-cli-service package
```
