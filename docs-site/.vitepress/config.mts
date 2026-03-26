import { defineConfig } from 'vitepress'

const enNav = [
  { text: 'Guide', link: '/guide/introduction' },
  { text: 'Features', link: '/features/docx-conversion' },
  { text: 'Reference', link: '/reference/api' },
  { text: 'GitHub', link: 'https://github.com/nhannguyen09/mdconvert' },
]

const viNav = [
  { text: 'Hướng dẫn', link: '/vi/guide/introduction' },
  { text: 'Tính năng', link: '/vi/features/docx-conversion' },
  { text: 'Tham chiếu', link: '/vi/reference/api' },
  { text: 'GitHub', link: 'https://github.com/nhannguyen09/mdconvert' },
]

const enSidebar = [
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
]

const viSidebar = [
  {
    text: 'Hướng dẫn',
    items: [
      { text: 'Giới thiệu', link: '/vi/guide/introduction' },
      { text: 'Cài đặt', link: '/vi/guide/installation' },
      { text: 'Bắt đầu nhanh', link: '/vi/guide/quick-start' },
      { text: 'Cấu hình', link: '/vi/guide/configuration' },
    ],
  },
  {
    text: 'Tính năng',
    items: [
      { text: 'Chuyển đổi DOCX', link: '/vi/features/docx-conversion' },
      { text: 'Chuyển đổi PDF', link: '/vi/features/pdf-conversion' },
      { text: 'Upload hàng loạt', link: '/vi/features/batch-upload' },
      { text: 'AI Providers', link: '/vi/features/ai-providers' },
    ],
  },
  {
    text: 'Tham chiếu',
    items: [
      { text: 'API', link: '/vi/reference/api' },
      { text: 'Database', link: '/vi/reference/database' },
      { text: 'Kiến trúc', link: '/vi/reference/architecture' },
    ],
  },
]

export default defineConfig({
  title: 'mdconvert',
  description: 'Convert Word & PDF to AI-ready Markdown with image descriptions',
  base: '/mdconvert/',

  head: [
    ['link', { rel: 'icon', href: '/mdconvert/favicon.ico' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en',
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi',
      themeConfig: {
        nav: viNav,
        sidebar: { '/vi/': viSidebar },
        footer: {
          message: 'Phát hành theo giấy phép AGPL-3.0.',
          copyright: 'Xây dựng bởi <a href="https://nhannguyensharing.com">NhanNguyenSharing (NNS)</a>',
        },
        editLink: {
          pattern: 'https://github.com/nhannguyen09/mdconvert/edit/main/docs-site/:path',
          text: 'Chỉnh sửa trang này trên GitHub',
        },
        docFooter: {
          prev: 'Trang trước',
          next: 'Trang sau',
        },
        outline: { label: 'Mục lục' },
        returnToTopLabel: 'Về đầu trang',
        sidebarMenuLabel: 'Menu',
      },
    },
  },

  themeConfig: {
    logo: { text: 'mdconvert' },
    nav: enNav,
    sidebar: { '/': enSidebar },

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
