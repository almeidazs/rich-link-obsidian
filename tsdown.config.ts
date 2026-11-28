import { defineConfig } from "tsdown";

const watch = process.argv.includes("--watch") || process.argv.includes("-w");

// Obsidian loads a single CommonJS `main.js` from the plugin root and
// provides the `obsidian` module at runtime, so everything else is bundled.
// Production: minified, no source map. `npm run dev` (watch): readable output
// with an inline source map.
export default defineConfig({
	entry: { main: "src/main.ts" },
	format: "cjs",
	platform: "neutral",
	target: "es2020",
	outDir: ".",
	clean: false,
	dts: false,
	minify: !watch,
	sourcemap: watch ? "inline" : false,
	treeshake: true,
	deps: { neverBundle: ["obsidian"], alwaysBundle: [/.*/] },
	outExtensions: () => ({ js: ".js" }),
});
