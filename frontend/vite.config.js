import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import defaultTheme from "tailwindcss/defaultTheme";
import colors from "tailwindcss/colors";
import flattenColorPalette from "tailwindcss/lib/util/flattenColorPalette.js";
import path from "path";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    historyApiFallback: true,
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    proxy: {
      "/cdn": {
        target: "https://unpkg.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ""),
        configure: (proxy, _options) => {
          proxy.on('proxyRes', function (proxyRes, req, res) {
            // Add required CORS headers to the proxied response
            proxyRes.headers['Cross-Origin-Resource-Policy'] = 'cross-origin';
          });
        }
      },
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

// Tailwind CSS config (as ESM)
const addVariablesForColors = ({ addBase, theme }) => {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(Object.entries(allColors).map(([key, val]) => [`--${key}`, val]));

  addBase({
    ":root": newVars,
  });
};

export const tailwindConfig = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      boxShadow: {
        input: `0px 2px 3px -1px rgba(0,0,0,0.1), 0px 1px 0px 0px rgba(25,28,33,0.02), 0px 0px 0px 1px rgba(25,28,33,0.08)`,
      },
    },
  },
  plugins: [addVariablesForColors],
};
