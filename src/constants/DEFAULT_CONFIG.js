export const DEFAULT_CONFIG = {
  // 是否对大小写敏感 '/AuTh/uSEr' => '/auth/user'
  /** @type {boolean} */
  sensitive: false,

  // 默认的 parentPath => router.addRoutes(routes, parentPath)
  /** @type {string} */
  parentPath: '/',

  // 获取资源的配置函数，支持同步和异步
  /** @type {Object|Function} */
  resources: () => {
    throw new Error()
  }
}
