import type { Editor } from 'obsidian';

// Minimal stand-in for Obsidian's Editor: just the methods url-detection uses.
// `from`/`to` are character offsets into `text` (selection when from !== to).
export function fakeEditor(text: string, from: number, to = from): Editor {
	const lines = text.split('\n');

	const offsetToPos = (offset: number) => {
		const before = text.slice(0, offset).split('\n');
		return {
			line: before.length - 1,
			ch: before[before.length - 1]?.length ?? 0,
		};
	};
	const posToOffset = (pos: { line: number; ch: number }) =>
		lines
			.slice(0, pos.line)
			.reduce((sum, line) => sum + line.length + 1, 0) + pos.ch;

	return {
		getSelection: () => text.slice(from, to),
		getCursor: (which?: string) => offsetToPos(which === 'to' ? to : from),
		getLine: (line: number) => lines[line] ?? '',
		posToOffset,
		offsetToPos,
	} as unknown as Editor;
}

// The text an EditorUrlMatch would replace.
export function textOf(
	editor: Editor,
	match: {
		from: { line: number; ch: number };
		to: { line: number; ch: number };
	},
): string {
	const text = Array.from({ length: 1000 }, (_, line) =>
		editor.getLine(line),
	).join('\n');
	return text.slice(
		editor.posToOffset(match.from),
		editor.posToOffset(match.to),
	);
}
