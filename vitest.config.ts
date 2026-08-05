import { defineConfig } from "vitest/config"

// The JSX runtime is not set here.
// Vitest resolves its own Vite, which trails the one WXT builds with, so naming that transform pins this file to whichever of the two is installed today.
// Both read `jsx` from tsconfig instead, which is the setting the editor and `tsc` already follow.
export default defineConfig({
  test: {
    environment: "jsdom",
    // `.claude` holds agent worktrees, full checkouts whose tests must not be collected into this repo's run.
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
