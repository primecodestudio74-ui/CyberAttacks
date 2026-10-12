/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const apiTarget = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000'

// The frontend talks to the backend through relative /api URLs (see
// src/utils/api.js). In development and preview the dev server proxies those
// requests, so the browser never needs to reach localhost directly - which is
// what makes the feature work on sandbox/preview and staging hosts.
const proxy = {
  '/api': {
    target: apiTarget,
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // listen on 0.0.0.0 so preview/proxy hosts can reach the dev server
    allowedHosts: true, // preview hosts (*.e2b.app etc.) are not known ahead of time
    proxy,
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy,
  },
})
