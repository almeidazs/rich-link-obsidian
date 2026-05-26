import type { ResolvedUrlMetadata } from "../url-resolution";

const FAVICON_RENDER_SIZE = "16x16";

export function buildRichMarkdownLink({
	url,
	title,
	iconUrl,
}: ResolvedUrlMetadata): string {
	const safeTitle = escapeMarkdownText(title);

	if (!iconUrl) {
		return `[${safeTitle}](<${url}>)`;
	}

	return `[![favicon|${FAVICON_RENDER_SIZE}](<${iconUrl}>) ${safeTitle}](<${url}>)`;
}

function escapeMarkdownText(value: string): string {
	return value
		.trim()
		.replace(/\r?\n+/g, " ")
		.replace(/\\/g, "\\\\")
		.replace(/\[/g, "\\[")
		.replace(/\]/g, "\\]")
		.replace(/\|/g, "\\|")
		.replace(/\*/g, "\\*")
		.replace(/_/g, "\\_");
}
