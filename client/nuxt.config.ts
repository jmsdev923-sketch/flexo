// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  ssr: false,
  modules: [
    '@pinia/nuxt'
  ],
  experimental: {
    appManifest: false
  },
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: 'flex_analytics - Enterprise Pivot & Multidimensional Analytics',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Motor y componente web de tablas dinámicas y analítica multidimensional inspirado en Flexmonster' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  nitro: {
    routeRules: {
      '/api/**': { proxy: 'http://localhost:4000/api/**' }
    }
  },
  devServer: {
    port: 3000
  }
});
