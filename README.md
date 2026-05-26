# Rich Link Resolver

`Rich Link Resolver` is an Obsidian plugin that turns a pasted or selected URL into a markdown rich link using the page title and favicon.

Example output:

```md
[![favicon|16x16](<https://example.com/favicon.ico>) Example Domain](<https://example.com>)
```

## Features

- Automatically resolves a pasted URL when the clipboard contains a single URL.
- Resolves the selected URL or the URL under the cursor through a command or context menu action.
- Shows an inline `Loading URL...` placeholder while metadata is being fetched.
- Uses the page favicon URL directly in the generated markdown, rendered at `16x16`.
- Falls back to a plain markdown link if a favicon URL cannot be resolved.
- Lets you choose whether the favicon appears before or after the title.
- Lets you ignore specific domains and exact URLs for automatic paste conversion.

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
3. Create and push a tag in the format `X.Y.Z`.

```bash
git tag 0.1.0
git push origin 0.1.0
```

4. The GitHub Actions release workflow will build the plugin and attach:
   - `main.js`
   - `manifest.json`
   - `styles.css`

## Submit to Obsidian Community Plugins

After the repository has at least one public GitHub release with the files above:

1. Go to `https://community.obsidian.md` and sign in with your Obsidian account.
2. Link your GitHub account to your profile.
3. Open `Plugins` in the sidebar and choose `New plugin`.
4. Submit the repository URL: `https://github.com/almeidazs/rich-link-obsidian`.
5. Follow the review feedback shown by the directory until the submission passes.
