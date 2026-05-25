import { Notice } from "obsidian";

export function showInvalidSelectionNotice(): void {
  new Notice("Select a valid URL or place the cursor on top of a URL.");
}

export function showCursorUrlNotice(): void {
  new Notice("Place the cursor on the URL in editing mode to resolve it.");
}
