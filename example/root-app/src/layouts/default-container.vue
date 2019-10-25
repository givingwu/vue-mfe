<template>
  <div class="conatainer">
    <header class="conatainer-head">
      <h1 class="conatainer-head-title">vue-mfe</h1>
      <ul class="conatainer-head-menu">
        <li v-for="link in links" :key="link.name">
          <template v-if="link.path">
            <router-link :to="link.path">{{link.name}}</router-link>
          </template>
        </li>
      </ul>
    </header>
    <main class="conatainer-body">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
const links = [
  {
    path: '/',
    name: 'root'
  },
  {
    path: '/demo',
    name: 'demo'
  },
  {
    path: '/lazy',
    name: 'lazy-demo'
  }
]

export default {
  name: 'DefaultContainer',
  data() {
    return {
      links
    }
  }
}
</script>

<style>
.conatainer {
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
}

.conatainer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 20px;
  padding-right: 20px;
  height: 50px;
  border-bottom: 1px solid #eee;
}

.conatainer-head-menu a {
  color: #999;
  text-decoration: none;
}

.conatainer-head-menu .router-link-exact-active {
  color: black;
  text-decoration: underline;
}

.conatainer-head-menu li {
  display: inline-block;
  padding-left: 20px;
  padding-right: 20px;
  margin: auto;
}

.conatainer-body {
  flex: 1;
  padding: 20px;
}
</style>
