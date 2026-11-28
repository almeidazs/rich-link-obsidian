import type { Editor } from "obsidian";
import type { EditorUrlMatch } from "../../types";

// Quotes and brackets are allowed inside a URL (`Rock_'n'_Roll`, `?a[]=1`);
// the ones that merely surround it are trimmed off afterwards.
const URL_PATTERN = /https?:\/\/[^\s<>"`]+/gi;
const HTTP_SCHEME = /^https?:\/\//i;
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/;
const CLOSING_TO_OPENING: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

export function normalizeClipboardUrl(
	value: string | null | undefined,
): string | null {
	if (!value) {
		return null;
	}

	return normalizeUrlCandidate(value);
}

export function findUrlToResolve(
	editor: Editor,
	preferredUrl?: string,
): EditorUrlMatch | null {
	const selectedUrl = findSelectedUrl(editor);

	if (selectedUrl && matchesPreferredUrl(selectedUrl.url, preferredUrl)) {
		return includeAutolinkBrackets(editor, selectedUrl);
	}

	const cursorUrl = findUrlAtCursor(editor);

	if (cursorUrl && matchesPreferredUrl(cursorUrl.url, preferredUrl)) {
		return includeAutolinkBrackets(editor, cursorUrl);
	}

	if (!preferredUrl) {
		return null;
	}

	const preferredMatch = findPreferredUrlInCursorLine(editor, preferredUrl);

	return preferredMatch && includeAutolinkBrackets(editor, preferredMatch);
}

/**
 * True when nothing but whitespace shares the line with the URL. Block-level
 * output (preview cards) is only safe there: mid-sentence, inside a list item,
 * a quote or a table row it would break the surrounding markdown.
 */
export function isUrlAloneOnLine(
	line: string,
	fromCh: number,
	toCh: number,
): boolean {
	return line.slice(0, fromCh).trim() === "" && line.slice(toCh).trim() === "";
}

// `<https://a.com>` is an autolink: replacing only the URL inside would leave
// `<[Title](<https://a.com>)>`, so the surrounding brackets go with it.
function includeAutolinkBrackets(
	editor: Editor,
	match: EditorUrlMatch,
): EditorUrlMatch {
	if (match.from.line !== match.to.line) {
		return match;
	}

	const line = editor.getLine(match.from.line);

	if (line[match.from.ch - 1] !== "<" || line[match.to.ch] !== ">") {
		return match;
	}

	return {
		url: match.url,
		from: { line: match.from.line, ch: match.from.ch - 1 },
		to: { line: match.to.line, ch: match.to.ch + 1 },
	};
}

function findSelectedUrl(editor: Editor): EditorUrlMatch | null {
	const selection = editor.getSelection();
	if (!selection) {
		return null;
	}

	const normalizedUrl = normalizeUrlCandidate(selection);

	if (!normalizedUrl) {
		return null;
	}

	// Locate the URL itself inside the selection: whitespace or `<` may precede it.
	const urlIndex = selection.indexOf(normalizedUrl);
	if (urlIndex === -1) {
		return null;
	}

	const startOffset = editor.posToOffset(editor.getCursor("from")) + urlIndex;
	const endOffset = startOffset + normalizedUrl.length;

	return {
		url: normalizedUrl,
		from: editor.offsetToPos(startOffset),
		to: editor.offsetToPos(endOffset),
	};
}

function findUrlAtCursor(editor: Editor): EditorUrlMatch | null {
	const cursor = editor.getCursor("from");
	const line = editor.getLine(cursor.line);

	for (const match of line.matchAll(URL_PATTERN)) {
		const rawMatch = match[0];
		const start = match.index ?? 0;
		const normalizedUrl = normalizeUrlCandidate(rawMatch);

		if (!normalizedUrl) {
			continue;
		}

		const end = start + normalizedUrl.length;
		if (cursor.ch < start || cursor.ch > end) {
			continue;
		}

		return {
			url: normalizedUrl,
			from: { line: cursor.line, ch: start },
			to: { line: cursor.line, ch: end },
		};
	}

	return null;
}

function findPreferredUrlInCursorLine(
	editor: Editor,
	preferredUrl: string,
): EditorUrlMatch | null {
	const cursor = editor.getCursor("from");
	const line = editor.getLine(cursor.line);
	const start = line.indexOf(preferredUrl);

	if (start === -1) {
		return null;
	}

	return {
		url: preferredUrl,
		from: { line: cursor.line, ch: start },
		to: { line: cursor.line, ch: start + preferredUrl.length },
	};
}

function matchesPreferredUrl(url: string, preferredUrl?: string): boolean {
	if (!preferredUrl) {
		return true;
	}

	return url === preferredUrl;
}

function normalizeUrlCandidate(value: string): string | null {
	let candidate = value.trim();

	if (candidate.startsWith("<") && candidate.endsWith(">")) {
		candidate = candidate.slice(1, -1).trim();
	}

	candidate = trimTrailingDecorations(candidate);

	if (!HTTP_SCHEME.test(candidate) || /\s/.test(candidate)) {
		return null;
	}

	try {
		const parsedUrl = new URL(candidate);
		if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
			return null;
		}

		return candidate;
	} catch {
		return null;
	}
}

// Strips what surrounds a URL in prose: sentence punctuation, quotes and an
// unbalanced closing bracket (`(see https://a.com)`), but keeps balanced ones
// that belong to the URL (`.../Foo_(bar)`).
function trimTrailingDecorations(value: string): string {
	let trimmed = value;
	let previous: string;

	do {
		previous = trimmed;
		trimmed = trimmed.replace(TRAILING_PUNCTUATION, "");

		const last = trimmed.slice(-1);
		const opening = CLOSING_TO_OPENING[last];

		if (opening && countCharacter(trimmed, last) > countCharacter(trimmed, opening)) {
			trimmed = trimmed.slice(0, -1);
		}
	} while (trimmed !== previous);

	return trimmed;
}

function countCharacter(value: string, character: string): number {
	let count = 0;

	for (const currentCharacter of value) {
		if (currentCharacter === character) {
			count += 1;
		}
	}

	return count;
}
