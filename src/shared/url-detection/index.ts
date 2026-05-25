import type { Editor, EditorPosition } from "obsidian";

const URL_PATTERN = /https?:\/\/[^\s<>"'`[\]{}]+/gi;
const TRAILING_PUNCTUATION = /[.,;!?]+$/;

export interface EditorUrlMatch {
	url: string;
	from: EditorPosition;
	to: EditorPosition;
}

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
		return selectedUrl;
	}

	const cursorUrl = findUrlAtCursor(editor);

	if (cursorUrl && matchesPreferredUrl(cursorUrl.url, preferredUrl)) {
		return cursorUrl;
	}

	if (!preferredUrl) {
		return null;
	}

	return findPreferredUrlInCursorLine(editor, preferredUrl);
}

function findSelectedUrl(editor: Editor): EditorUrlMatch | null {
	const selection = editor.getSelection();
	if (!selection) {
		return null;
	}

	const trimmedSelection = selection.trim();
	const normalizedUrl = normalizeUrlCandidate(trimmedSelection);

	if (!normalizedUrl) {
		return null;
	}

	const fromOffset = editor.posToOffset(editor.getCursor("from"));
	const leadingWhitespaceLength = selection.match(/^\s*/)?.[0].length ?? 0;
	const startOffset = fromOffset + leadingWhitespaceLength;
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

	if (!candidate || /\s/.test(candidate)) {
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

function trimTrailingDecorations(value: string): string {
	let trimmed = value.replace(TRAILING_PUNCTUATION, "");

	while (trimmed.endsWith(")") && hasMoreClosingParentheses(trimmed)) {
		trimmed = trimmed.slice(0, -1);
	}

	return trimmed;
}

function hasMoreClosingParentheses(value: string): boolean {
	const opening = countCharacter(value, "(");
	const closing = countCharacter(value, ")");

	return closing > opening;
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
