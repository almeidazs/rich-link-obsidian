// Decides whether inserting a rich link at a given position would break the
// surrounding markdown (link syntax or code). Kept free of Obsidian imports so
// it can be unit-tested with `node --test`.

import type { OpenFence, PasteContext, RichLinkBlocker } from "../../types";

// `](` optionally followed by spaces and/or the `<` of an angle-bracket
// destination, anchored to the end: the cursor sits where a link URL goes.
const LINK_DESTINATION_START = /\]\(\s*<?$/;

// CommonMark fence: up to 3 spaces of indent, then 3+ backticks or tildes.
// 4+ spaces would make it an indented code block line instead, which we
// deliberately don't treat as code (it collides with nested list content).
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

const HTTP_URL = /^https?:\/\/\S+$/i;

export function findRichLinkBlocker({
	textBeforeCursor,
	selection,
}: PasteContext): RichLinkBlocker | null {
	const lines = textBeforeCursor.split(/\r?\n/);
	const currentLine = lines.pop() ?? "";

	if (isInsideFencedCode(lines)) {
		return "fenced-code";
	}

	if (isInsideInlineCode(currentLine)) {
		return "inline-code";
	}

	if (LINK_DESTINATION_START.test(currentLine)) {
		return "link-destination";
	}

	if (isPlainTextSelection(selection)) {
		return "link-text-selection";
	}

	return null;
}

/**
 * Walks the completed lines before the cursor, tracking the open fence.
 * A fence only closes on the same character with at least the same length
 * and nothing but whitespace after it, so ``` can't be closed by ~~~ and
 * ```` can't be closed by ```.
 */
function isInsideFencedCode(completedLines: string[]): boolean {
	let openFence: OpenFence | null = null;

	for (const line of completedLines) {
		const match = FENCE_LINE.exec(line);
		if (!match) {
			continue;
		}

		const marker = match[1] ?? "";
		const rest = match[2] ?? "";
		const character = marker.charAt(0);

		if (!openFence) {
			openFence = { character, length: marker.length };
			continue;
		}

		const closesOpenFence =
			character === openFence.character &&
			marker.length >= openFence.length &&
			rest.trim() === "";

		if (closesOpenFence) {
			openFence = null;
		}
	}

	return openFence !== null;
}

/**
 * An inline code span opened by a run of N backticks is closed only by
 * another run of exactly N backticks. A span still open at the cursor means
 * we are inside code, even if the user hasn't typed the closing run yet.
 */
function isInsideInlineCode(line: string): boolean {
	let openRunLength = 0;

	for (const match of line.matchAll(/`+/g)) {
		const runLength = match[0].length;

		if (openRunLength === 0) {
			openRunLength = runLength;
		} else if (runLength === openRunLength) {
			openRunLength = 0;
		}
	}

	return openRunLength > 0;
}

function isPlainTextSelection(selection: string): boolean {
	const trimmed = selection.trim();
	return trimmed !== "" && !HTTP_URL.test(trimmed);
}
