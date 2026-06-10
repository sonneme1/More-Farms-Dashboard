import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'greenAcres',
    themes: {
      greenAcres: {
        dark: false,
        colors: {
          primary: '#2E7D32',
          secondary: '#F9A825',
          accent: '#F9A825',
          background: '#F5F5F0',
          surface: '#FFFFFF',
          'on-surface': '#2C2C2C',
          error: '#C62828',
          success: '#2E7D32',
          warning: '#F9A825',
          info: '#5D7B6A',
        },
      },
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
    },
  },
})
