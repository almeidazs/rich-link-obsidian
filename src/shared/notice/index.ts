import { Notice } from "obsidian";

export function showInvalidSelectionNotice(): void {
  new Notice("Select a valid URL or place the cursor on top of a URL.");
}

export function showCursorUrlNotice(): void {
  new Notice("Place the cursor on the URL in editing mode to resolve it.");
}

export function showBlockedUrlNotice(): void {
  new Notice("This URL is inside a link or code block, so it was left as is.");
}
