import { defineConfig } from "npm:vite@^5.0.10"
import react from "npm:@vitejs/plugin-react@^4.2.1"
import httpsImports from "npm:vite-plugin-https-imports@0.1.0"
import { nodePolyfills } from "npm:vite-plugin-node-polyfills@0.22.0"

import "npm:react@^18.2.0"
import "npm:react-dom@^18.2.0"

/**
 * Vite plugin to hack a bug injected by the default assetImportMetaUrlPlugin
 */
function workaroundAssetImportMetaUrlPluginBug() {
  return {
    name: "vite-workaround-import-glob",
    transform(src, id) {
      if (id.includes('validator/main.js')) {
        return src.replace(", import.meta.url", "")
      } else {
        return null
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  plugins: [
    workaroundAssetImportMetaUrlPluginBug(),
    httpsImports.default(),
    react(),
    nodePolyfills({
        globals: { Buffer: true }
    })
  ],
  build: {
    // ... other configurations
    resolve: {
      alias: {
        "^npm:": "./node_modules/", // or path to your node_modules directory
      },
    },
  },
})
