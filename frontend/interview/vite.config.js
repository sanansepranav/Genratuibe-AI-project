import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const configuredSiteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
  const siteUrl = configuredSiteUrl || 'http://localhost:5173'
  const googleVerification = (env.VITE_GOOGLE_SITE_VERIFICATION || '').trim()

  return {
  plugins: [react(), {
    name: 'generate-seo-assets',
    transformIndexHtml(html) {
      const verificationTag = googleVerification
        ? `<meta name="google-site-verification" content="${googleVerification}" />`
        : ''
      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replace('<!-- GOOGLE_SITE_VERIFICATION -->', verificationTag)
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin/\nDisallow: /interview/report/\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n  </url>\n</urlset>\n`,
      })
    },
  }],
  resolve: {
    alias: {
      '@auth': path.resolve(__dirname, '../auth'),
      '@interviews': path.resolve(__dirname, '../interviews'),
      '@admin': path.resolve(__dirname, '../admin'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'axios': path.resolve(__dirname, 'node_modules/axios'),
      '@clerk/react': path.resolve(__dirname, 'node_modules/@clerk/react'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  }
})
