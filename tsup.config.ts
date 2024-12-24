import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: false,
  entry: ["src/index.ts"],
  esbuildOptions(options) {
    options.external = [
      "@fastify/static",
      "@fastify/swagger-ui",
      "@fastify/swagger",
    ];
  },
  esbuildPlugins: [],
  format: "cjs",
  minify: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  tsconfig: "./tsconfig.json",
});
