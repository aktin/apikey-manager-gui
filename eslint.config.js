/**
 * ESLint configuration for the Electron + Vue 3 + Vite project.
 *
 * Uses ESLint's flat config format (v9+) via the official Vue tooling:
 * - `eslint-plugin-vue` flat/essential rules for Single File Components (.vue)
 * - `@vue/eslint-config-typescript` wires up `vue-eslint-parser` together with
 *   typescript-eslint, so `<script lang="ts">` blocks and `.ts` files are parsed
 *   and linted correctly (the manual parser setup before this could not parse SFCs).
 *
 * Formatting (quotes, semicolons, …) is owned by Prettier, not ESLint.
 *
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @see https://github.com/vuejs/eslint-config-typescript
 */
import pluginVue from "eslint-plugin-vue";
import {
  defineConfigWithVueTs,
  vueTsConfigs
} from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  { ignores: ["**/.vite/**", "**/dist/**", "**/out/**", "**/node_modules/**"] },
  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ]
    }
  }
);
