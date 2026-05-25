import esbuild from "esbuild";

const production = !process.argv.includes("--watch");

const context = await esbuild.context({
	entryPoints: ["src/main.ts"],
	bundle: true,
	external: ["obsidian"],
	format: "cjs",
	platform: "browser",
	target: "es2020",
	logLevel: "info",
	minify: production,
	sourcemap: production ? false : "inline",
	treeShaking: true,
	outfile: "main.js",
});

if (production) {
	await context.rebuild();
	await context.dispose();
} else {
	await context.watch();
	console.log("Watching for changes...");
}
