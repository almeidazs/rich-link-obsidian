import type { IconPosition } from "../../settings";
import type { ResolvedUrlMetadata } from "../url-resolution";

const FAVICON_RENDER_SIZE = "16x16";

export function buildRichMarkdownLink(
	{ url, title, description, iconUrl }: ResolvedUrlMetadata,
	iconPosition: IconPosition,
	renderAsCard: boolean,
): string {
	if (renderAsCard) {
		return buildRichLinkCard({ url, title, description, iconUrl });
	}

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

function buildRichLinkCard({
	url,
	title,
	description,
	iconUrl,
}: ResolvedUrlMetadata): string {
	const safeUrl = escapeHtmlAttribute(url);
	const safeTitle = escapeHtmlText(title);
	const safeDescription = description ? escapeHtmlText(description) : null;
	const safeHost = escapeHtmlText(formatHostname(url));
	const safeIconUrl = iconUrl ? escapeHtmlAttribute(iconUrl) : null;
	const safeFallbackInitial = escapeHtmlText(title.slice(0, 1).toUpperCase());
	const visualIcon = safeIconUrl
		? `<img src="${safeIconUrl}" alt="" class="rich-link-card__visual-icon">`
		: `<span class="rich-link-card__visual-fallback">${safeFallbackInitial}</span>`;
	const footerIcon = safeIconUrl
		? `<img src="${safeIconUrl}" alt="" class="rich-link-card__favicon">`
		: "";
	const descriptionMarkup = safeDescription
		? `\n\t\t<p class="rich-link-card__description">${safeDescription}</p>`
		: "";

	return `<div class="rich-link-card">
\t<a class="rich-link-card__visual" href="${safeUrl}">
\t\t${visualIcon}
\t\t<span class="rich-link-card__visual-title">${safeTitle}</span>
\t</a>
\t<a class="rich-link-card__content" href="${safeUrl}">
\t\t<strong class="rich-link-card__title">${safeTitle}</strong>${descriptionMarkup}
\t\t<span class="rich-link-card__source">${footerIcon}<span>${safeHost}</span></span>
\t</a>
</div>`;
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

function escapeHtmlText(value: string): string {
	return value
		.trim()
		.replace(/\r?\n+/g, " ")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function escapeHtmlAttribute(value: string): string {
	return escapeHtmlText(value)
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function formatHostname(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
}
