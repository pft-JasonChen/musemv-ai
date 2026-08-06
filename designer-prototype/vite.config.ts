import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Vite's default CSS minifier (Lightning CSS) has a bug where a rule
    // declaring both `backdrop-filter` and `-webkit-backdrop-filter` gets
    // collapsed down to only the -webkit- one, silently dropping the
    // standard property in the production build (dev server is unminified
    // and unaffected). Browsers that don't honor the legacy -webkit- alias
    // (e.g. Firefox) then show no blur at all post-deploy. Disabling CSS
    // minification avoids this; the size cost is negligible next to this
    // project's multi-MB video/audio assets.
    cssMinify: false,
  },
})
