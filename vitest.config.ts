import { defineConfig } from "vitest/config"

export default defineConfig({
  // Vite 8 moved JSX handling from esbuild to oxc, so the transform options
  // live under `oxc` now.
  oxc: {
    jsx: {
      runtime: "automatic"
    }
  },
  test: {
    environment: "jsdom",
    // `.claude` holds agent worktrees — full checkouts whose tests must not be
    // collected into this repo's run.
    exclude: [
      "**/node_modules/**",
      "**/.output/**",
      "**/.wxt/**",
      "**/e2e/**",
      "**/.claude/**"
    ],
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      reporter: ["text", "lcov"]
    }
  },
  resolve: {
    alias: {
      "~": new URL("./src", import.meta.url).pathname
    }
  }
})
