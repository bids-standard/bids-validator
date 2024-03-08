import { defineConfig } from "npm:vite@^5.0.10"
import react from "npm:@vitejs/plugin-react@^4.2.1"
import httpsImports from "npm:vite-plugin-https-imports@0.1.0"

import "npm:react@^18.2.0"
import "npm:react-dom@^18.2.0"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [httpsImports.default(), react()],
  build: {
    // ... other configurations
    resolve: {
      alias: {
        "^npm:": "./node_modules/", // or path to your node_modules directory
      },
    },
  },
})
