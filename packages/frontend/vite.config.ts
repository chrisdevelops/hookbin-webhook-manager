import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "spa-fallback",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || ""

          // Skip if path has file extension (static assets)
          if (/\.\w+$/.test(url.split("?")[0])) {
            return next()
          }

          // Skip Vite internal paths
          if (url.startsWith("/@") || url.startsWith("/node_modules")) {
            return next()
          }

          // Skip API and webhook paths (handled by proxy)
          if (url.startsWith("/api") || url.startsWith("/webhook")) {
            return next()
          }

          // For all other paths, serve index.html to let React Router handle it
          req.url = "/index.html"
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "^/webhook(?!s)": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
