<template>
  <section style="padding: 20px">
    <header>
      <h2>demo self layout</h2>
    </header>
    <main>
      <div>
        <router-link to="/demo">back</router-link>
      </div>
      <div>
        <example></example>
      </div>
    </main>
  </section>
</template>

<script>
import example from '../components/example'

export default {
  name: 'DemoLayout',
  components: {
    example
  }
}
</script>
