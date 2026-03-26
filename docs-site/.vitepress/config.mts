import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'mdconvert',
  description: 'Convert Word & PDF to AI-ready Markdown with image descriptions',
  base: '/mdconvert/',

  head: [
    ['link', { rel: 'icon', href: '/mdconvert/favicon.ico' }],
  ],

  themeConfig: {
    logo: { text: 'mdconvert' },

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Features', link: '/features/docx-conversion' },
      { text: 'Reference', link: '/reference/api' },
      { text: 'GitHub', link: 'https://github.com/nhannguyen09/mdconvert' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Installation', link: '/guide/installation' },
          { text: 'Quick Start', link: '/guide/quick-start' },
          { text: 'Configuration', link: '/guide/configuration' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'DOCX Conversion', link: '/features/docx-conversion' },
          { text: 'PDF Conversion', link: '/features/pdf-conversion' },
          { text: 'Batch Upload', link: '/features/batch-upload' },
          { text: 'AI Providers', link: '/features/ai-providers' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'API', link: '/reference/api' },
          { text: 'Database', link: '/reference/database' },
          { text: 'Architecture', link: '/reference/architecture' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/nhannguyen09/mdconvert' },
    ],

    footer: {
      message: 'Released under the AGPL-3.0 License.',
      copyright: 'Built with ❤️ by <a href="https://nhannguyensharing.com">NhanNguyenSharing (NNS)</a>',
    },

    editLink: {
      pattern: 'https://github.com/nhannguyen09/mdconvert/edit/main/docs-site/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
