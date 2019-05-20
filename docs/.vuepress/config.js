module.exports = {
  title: 'Vue-MFE',
  description: '快速创建基于 Vue.js 的微前端应用',
  serviceWorker: true,

  themeConfig: {
    repo: 'vuchan/vue-mfe',
    docsDir: 'docs',
    lastUpdated: 'Last Updated',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Plugin', link: '/plugin/' },
      { text: 'Boilerplate', link: '/boilerplate/' },
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
        // 'next-planning',
      ],
      '/plugin/': ['', 'getting-started'],
      '/boilerplate/': [
        '',
        'development',
        'architecture',
        'tech',
        'routing',
        'state',
        'tests',
        'linting',
        'editors',
        'production',
        'troubleshooting',
      ],
      '/': ['', '/'],
    },
  },
}
