import VueRouter from 'vue-router'

export default class RouterManager {
  constructor(oldRouter) {
    this.router = oldRouter
    this.routes = oldRouter.options.routes

    this.pathList = []
    this.pathNameMap = {}
    this._init()
  }

  _init() {
    this.refreshPathState(this.routes)
  }

  addRoutes(routes) {
    this.router.matcher = new VueRouter(
      this.normalizeOptions(this.router.options, { routes })
    ).matcher
  }

  normalizeOptions(oldOpts, newOpts) {
    const { routes: oldRoutes, ...oldProps } = oldOpts
    const { routes: newRoutes, ...newProps } = newOpts

    return Object.assign(
      {
        routes: this.mergeRoutes(oldRoutes, newRoutes),
      },
      newProps,
      oldProps
    )
  }

  mergeRoutes(oldRoutes, newRoutes) {
    this.refreshPathState(newRoutes)
  }

  refreshPathState(routes) {
    const { pathMap, pathList } = this

    routes.forEach(({ path, parentPath, name, children }) => {
      if (parentPath) path = completePaths(path, parentPath)

      if (name) {
        if (!pathMap[name]) {
          pathMap[name] = path
        } else {
          warn(`The name ${name} in pathMap has been existed`)
        }
      }

      if (path) {
        if (path)
      }

      if (path && !pathList.includes(path)) pathList.push(path)

      if (children && children.length) {
        this.refreshPathState(children, path)
      }
    })
  }
}
