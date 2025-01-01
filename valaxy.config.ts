import { defineValaxyConfig } from 'valaxy'
import type { UserThemeConfig } from 'valaxy-theme-yun'

// add icons what you will need
const safelist = [
  'i-ri-home-line',
]

/**
 * User Config
 */
export default defineValaxyConfig<UserThemeConfig>({
  // site config see site.config.ts

  theme: 'yun',

  themeConfig: {

    type: 'nimbo',

    banner: {
      enable: true,
      title: '喵呜喵呜',
      cloud: {
        enable: false,
      },
    },

    pages: [
      {
        name: '友链',
        url: '/links/',
        icon: 'i-ri-link',
        color: 'dodgerblue',
      }
    ],

    footer: {
      since: 2022,
      beian: {
        enable: false,
        icp: '',
      },
      icon: {
        enable: false,
      },
      powered: true
    },

    say: {
      enable: true,
      api: 'say.json',
      hitokoto: {
        enable: false,
        api: '',
      }
    }
  },
  unocss: { safelist },
})
