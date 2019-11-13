module.exports = {
  title: 'Vue-MFE',
  description: '✨A micro-frontend solution based on Vue.js',
  serviceWorker: true,

  themeConfig: {
    repo: 'vuchan/vue-mfe',
    docsDir: 'docs',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugin', link: '/plugin/' },
      // { text: 'Boilerplate', link: '/boilerplate/' },
    ],
    editLinks: true,
    sidebarDepth: 4,
    sidebar: {
      '/guide/': [
        '',
        'getting-started',
        'coding-agreement',
        'enhanced-router',
        'notice-events',
      ],
      '/plugin/': ['', 'getting-started'],
      '/': ['', '/'],
    },
  },
}
