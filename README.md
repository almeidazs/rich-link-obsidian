# Rich Link Resolver

`Rich Link Resolver` is an Obsidian plugin that turns a pasted or selected URL into a markdown rich link using the page title and favicon.

Example output:

```md
[![](<app://local-favicon.png>) Example Domain](<https://example.com>)
```

## Features

- Automatically resolves a pasted URL when the clipboard contains a single URL.
- Resolves the selected URL or the URL under the cursor through a command or context menu action.
- Shows an inline `Loading URL...` placeholder while metadata is being fetched.
- Resizes favicons to a stable `16x16` local cache so note layout does not break.
- Falls back to a plain markdown link if a favicon cannot be downloaded or resized.

## Local testing

1. Install dependencies:

```bash
npm install
```

2. Build the plugin:

```bash
npm run build
```

3. Copy it into your vault:

```bash
npm run install:local -- "/absolute/path/to/Your Vault"
```

You can also use:

```bash
OBSIDIAN_VAULT_PATH="/absolute/path/to/Your Vault" npm run install:local
```

4. In Obsidian, open `Settings -> Community plugins`, reload plugins, and enable `Rich Link Resolver`.

## Development

Watch mode:

```bash
npm run dev
```

After each rebuild, copy the latest plugin files again:

```bash
npm run install:local -- "/absolute/path/to/Your Vault"
```

## Release process

This repository is set up for GitHub-based releases.

1. Update `manifest.json`, `versions.json`, and `package.json` to the new version.
2. Commit and push the changes.
3. Create and push a tag in the format `vX.Y.Z`.

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. The GitHub Actions release workflow will build the plugin and attach:
   - `main.js`
   - `manifest.json`
   - `styles.css`

## Publish to Obsidian Community Plugins

After the repository has at least one public GitHub release with the files above:

1. Open a pull request against `obsidianmd/obsidian-releases`.
2. Add your repository to `community-plugins.json`.
3. Wait for the Obsidian review process to approve it.
