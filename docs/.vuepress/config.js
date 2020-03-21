module.exports = {
  title: 'Vue-MFE',
  description: '✨可能是最简单的 Vue.js 微前端实现方式',
  serviceWorker: true,

  themeConfig: {
    repo: 'vuchan/vue-mfe',
    docsDir: 'docs',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugin', link: '/plugin/' }
      // { text: 'Boilerplate', link: '/boilerplate/' },
    ],
    editLinks: true,
    sidebarDepth: 4,
    sidebar: {
      '/guide/': ['', 'getting-started', 'micro-frontends'],
      '/plugin/': ['', 'getting-started'],
      '/': ['', '/']
    }
  }
}
