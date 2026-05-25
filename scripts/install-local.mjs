import { cp, mkdir } from "node:fs/promises";
import path from "node:path";

const pluginId = "rich-link-resolver";
const vaultPath = process.argv[2] ?? process.env.OBSIDIAN_VAULT_PATH;

if (!vaultPath) {
  console.error(
    "Missing vault path. Use `npm run install:local -- /path/to/Vault` or set OBSIDIAN_VAULT_PATH.",
  );
  process.exit(1);
}

const rootDir = process.cwd();
const targetDir = path.join(vaultPath, ".obsidian", "plugins", pluginId);
const filesToCopy = ["main.js", "manifest.json", "styles.css"];

await mkdir(targetDir, { recursive: true });

for (const fileName of filesToCopy) {
  const source = path.join(rootDir, fileName);
  const target = path.join(targetDir, fileName);
  await cp(source, target, { force: true });
}

console.log(`Installed ${pluginId} to ${targetDir}`);
