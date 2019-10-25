<template>
  <div class="app">
    <router-view v-bind="$data"></router-view>
  </div>
</template>

<script>
import {
  LOAD_START,
  LOAD_SUCCESS,
  LOAD_ERROR
} from '../../../src/constants/EVENT_TYPE'

export default {
  name: 'App',
  created() {
    this.bindEventListeners()
  },
  methods: {
    bindEventListeners() {
      this.$root.$on(LOAD_START, ({ name, ...props }) => {
        console.log('props: ', props)
        console.log(`Start loading sub-application ${name}`)
      })

      this.$root.$on(LOAD_SUCCESS, ({ name, ...props }) => {
        console.log('props: ', props)
        console.log(
          `Loaded sub-application ${name} successfully, current running is ${name}`
        )
      })

      this.$root.$on(LOAD_ERROR, (error) => {
        console.log(`Load sub-application failed`)
        console.error('error: ', error);
      })
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
.app {
  width: 100%;
  height: 100%;
}
</style>
