import { defineConfig } from "npm:vite@^5.0.10"
import react from "npm:@vitejs/plugin-react@^4.2.1"
import httpsImports from "npm:vite-plugin-https-imports@0.1.0"
import { nodePolyfills } from "npm:vite-plugin-node-polyfills@0.22.0"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Side-effect imports that exist only to make Deno install these into
// node_modules, where Vite can resolve them as bare specifiers.
import "npm:react@^18.2.0"
import "npm:react-dom@^18.2.0"
import "npm:react-markdown@^10.1.0"

// canvas-confetti cannot be pinned the same way: Deno exposes an
// OffscreenCanvas whose 2D context is null, so the package's SSR guard passes
// and it crashes on load while Vite is reading this config. Resolving it
// installs it without executing it, and the alias below lets Vite find it
// despite the missing top-level node_modules link.
const canvasConfetti = path.dirname(
  fileURLToPath(import.meta.resolve("npm:canvas-confetti@1.9.3/package.json")),
)

/**
 * Vite plugin to hack a bug injected by the default assetImportMetaUrlPlugin
 */
function workaroundAssetImportMetaUrlPluginBug() {
  return {
    name: "vite-workaround-import-glob",
    transform(src, id) {
      if (src.includes(', import.meta.url')) {
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
  resolve: {
    alias: { "canvas-confetti": canvasConfetti },
  },
})
