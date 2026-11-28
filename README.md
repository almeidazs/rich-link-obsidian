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
- Can render resolved URLs as preview cards instead of favicon + title links.
- Lets you ignore specific domains and exact URLs for automatic paste conversion.
- Leaves the URL untouched when converting it would break the surrounding markdown:
  - pasting where a link URL goes, e.g. right after `[Hello](`
  - pasting over selected text, so Obsidian's built-in `[selected text](url)` behavior still works
  - pasting inside a fenced code block (` ``` ` / `~~~`) or inline code

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
VAULT="/absolute/path/to/Your Vault"
mkdir -p "$VAULT/.obsidian/plugins/rich-link-resolver"
cp main.js manifest.json styles.css "$VAULT/.obsidian/plugins/rich-link-resolver/"
```

4. In Obsidian, open `Settings -> Community plugins`, reload plugins, and enable `Rich Link Resolver`.

## Development

Run the unit tests (uses Node's built-in test runner, Node 22.18+ / 23.6+):

```bash
npm test
```

Watch mode:

```bash
npm run dev
```

After each rebuild, copy the latest plugin files again:

```bash
VAULT="/absolute/path/to/Your Vault"
mkdir -p "$VAULT/.obsidian/plugins/rich-link-resolver"
cp main.js manifest.json styles.css "$VAULT/.obsidian/plugins/rich-link-resolver/"
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
