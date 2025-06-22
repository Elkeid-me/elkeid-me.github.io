import { defineSiteConfig } from 'valaxy'

export default defineSiteConfig({
  url: 'https://elkeid-me.github.io',
  lang: 'zh-CN',
  title: 'Elkeid\'s Site',
  subtitle: '',
  author: {
    name: 'Elkeid',
    avatar: '/avatar.webp',
    status: {
      emoji: '',
      message: '',
    }
  },
  description: '',
  social: [
    {
      name: 'GitHub',
      link: 'https://github.com/Elkeid-me',
      icon: 'i-ri-github-line',
      color: '#6e5494',
    },
    {
      name: 'E-Mail',
      link: 'mailto:elkeid.me@gmail.com',
      icon: 'i-ri-mail-line',
      color: '#8E71C1',
    },
  ],

  search: {
    enable: true,
  },

  sponsor: {
    enable: false,
    title: '',
    methods: [
    ],
  },

  license: { enabled: false },
  lastUpdated: false,

  favicon: '/favicon.svg',

  encrypt: {
    enable: true,
  },
})
