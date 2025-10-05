// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isCustomDomain = process.env.CUSTOM_DOMAIN === '1'

export default defineConfig({
  plugins: [react()],
  base: isCustomDomain ? '/' : '/yahtzee-front/',
})
