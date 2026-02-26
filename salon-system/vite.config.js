import { defineConfig } from 'vite'
import { writeFileSync } from 'fs'
import { join } from 'path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = 'https://www.skinstudio.cz'
const today = () => new Date().toISOString().slice(0, 10)

/** Generates sitemap.xml at build time with current date (for SEO). */
function sitemapPlugin() {
  return {
    name: 'sitemap',
    closeBundle() {
      const outDir = join(process.cwd(), 'dist')
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/kosmetika</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/pmu</loc><lastmod>${today()}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/rezervace</loc><lastmod>${today()}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>`
      writeFileSync(join(outDir, 'sitemap.xml'), sitemap.trim(), 'utf8')
    },
  }
}

export default defineConfig({
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  plugins: [
    react(),
    sitemapPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Skin Studio',
        short_name: 'SkinStudio',
        description: 'Rezervační systém Skin Studio',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    testTimeout: 10000,
    pool: 'vmThreads',
    server: {
      deps: {
        inline: ['react-router', 'react-router-dom'],
      },
    },
  },
})