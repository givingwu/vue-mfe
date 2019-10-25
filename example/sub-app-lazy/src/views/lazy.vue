<template>
  <div>
    <header>
      <h2>I am Lazy Page</h2>
      <router-link to="/lazy/component">to lazy-component</router-link>
    </header>

    <main>
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'Lazy'
}
</script>
