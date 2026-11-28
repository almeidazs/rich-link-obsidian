export type RichLinkBlocker =
	| "link-destination"
	| "link-text-selection"
	| "link-text"
	| "frontmatter"
	| "fenced-code"
	| "inline-code";

export interface PasteContext {
	/** Document text from the start up to the insertion point. */
	textBeforeCursor: string;
	/** Text that the insertion will replace ("" when nothing is selected). */
	selection: string;
}

export interface OpenFence {
	character: string;
	length: number;
}
