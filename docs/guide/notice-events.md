---
title: 注意事项
lang: zh-CN
meta:
  - name: description
    content: VUE-MFE 注意事项
  - name: keywords
    content: vue, vue-mfe, VUE-MFE
---

# 注意事项

::: warning GLOBAL VARIABLES
+ **避免注入**业务性的全局变量。
+ 业务性全局变量的注入**请谨慎**。
+ 非要注入请加上 unique namespace key.
:::

BAD:
```js
import CONSTS from '@/CONSTS'

Vue.prototype.CONSTS = CONSTS;
```

GOOD:
```js
// src/mixins/withConstants
import CONSTS from '@/CONSTS'

export {
  data() {
    return {
      $CONSTS: CONSTS
    }
  }
}
```

```js
// webpack entry
import CONSTS from '@/CONSTS'

Vue.prototype.NAMESPACED_CONSTS = CONSTS;
```
