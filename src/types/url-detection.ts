import type { EditorPosition } from "obsidian";

export interface EditorRange {
	from: EditorPosition;
	to: EditorPosition;
}

export interface EditorUrlMatch extends EditorRange {
	url: string;
}
