import type { IconPosition } from "../../settings";
import type { ResolvedUrlMetadata } from "../url-resolution";

const FAVICON_RENDER_SIZE = "16x16";

export function buildRichMarkdownLink(
	{ url, title, iconUrl }: ResolvedUrlMetadata,
	iconPosition: IconPosition,
): string {
	const safeTitle = escapeMarkdownText(title);

	if (!iconUrl) {
		return `[${safeTitle}](<${url}>)`;
	}

	const faviconMarkdown = `![favicon|${FAVICON_RENDER_SIZE}](<${iconUrl}>)`;

	if (iconPosition === "after-title") {
		return `[${safeTitle} ${faviconMarkdown}](<${url}>)`;
	}

	return `[${faviconMarkdown} ${safeTitle}](<${url}>)`;
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
