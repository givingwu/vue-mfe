<template>
  <div class="demo">
    <h2>Demo page</h2>
    <div class="demo-container">
      <header>
        <router-link to="/demo/layout">into demo self layout</router-link>
      </header>
      <main>
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import example from '../components/example'

export default {
  name: 'DemoPage',
  components: {
    example
  }
}
</script>
