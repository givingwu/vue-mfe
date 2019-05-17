import VueRouter from 'vue-router'
import { warn } from '../src/helpers/index'

export class VueMfe {
  constructor(opts = {}) {
    if (!opts || !opts.router) {
      warn(
        `Must pass the router property in 'Vue.use(VueMfe, { router, config })'`
      )
    }

    if (opts instanceof VueRouter) {
      this.router = opts
    } else {
      const { router, config = {} } = opts

      this.router = router
      this.config = config
    }

    this._init()
  }

  _init() {}
}
