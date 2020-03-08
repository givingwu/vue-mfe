---
lang: zh-CN
title: '快速上手'
---

## 从零开始

从零演示如何使用 `vue-cli-plugin-mfe` 创建一个微前端 domain 应用。

::: tip
建议在编写构建脚本的时候，每次运行下 `npm update vue-cli-plugin-mfe` 已确定当前使用的是最新版本
:::

### **安装**最新的 [vue-cli3](http://cli.vuejs.org)

```bash
yarn global add @vue/cli
```

本地安装后 vue-cli 的版本截图：
![vue-cli-version](/images/vue-cli-version.png)

### **创建**一个新的 `vue` 项目

```bash
vue create domain-name // domain-name 最终会被匹配成路由路径
```

GIF:

![vue-cli-create-new-project-features](/images/vue-cli-create-new-project-features.gif)

- **内网用户**，可更改 `--registry`，[如何更改？](/guide/#内网用户)

### **安装插件**

- 使用 `vue add mfe` 安装 `vue-cli-plugin-mfe` 插件

```bash
vue add mfe --registry=/your/registry/path
```

GIF:

![vue-cli-add-mfe-plugin](/images/vue-cli-add-mfe-plugin.gif)

- 如果遇到文件已存在的**错误**：

```bash
rm -rf node_module
// 再重新执行 add 试试
```

- 安装成功:

![vue-add-portal-plugin-success](/images/vue-add-portal-plugin-success.png)

- **第一步**是执行插件生命周期的[prompts](https://cli.vuejs.org/dev-guide/plugin-dev.html#prompts)，根据自己需要选择即可:
- **第二步**执行插件的生命周期的[Generator](https://cli.vuejs.org/dev-guide/plugin-dev.html#generator)，生成相关文件：

![invoke-portal-plugin](/images/invoke-portal-plugin.png)

## 启动项目

```bash
yarn start
```

如果遇到缺少依赖的问题，安装一下依赖即可。

## 打包项目

`yarn run package`，打包成功后会被压缩成 `tar` 包并自动上传到 `upload-url`。

END.
