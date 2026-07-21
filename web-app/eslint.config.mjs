// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([...nextVitals, ...nextTs, prettier, globalIgnores([
  ".next/**",
  ".claude/**",
  "out/**",
  "build/**",
  "storybook-static/**",
  "public/**",
  "next-env.d.ts",
  "e2e/**",
  "playwright.config.ts",
  "test-results/**",
  "playwright-report/**",
]), ...storybook.configs["flat/recommended"]]);

export default eslintConfig;
