import type { ResolvedUrlMetadata, RichMarkdownLinkOptions } from '../../types';

const FAVICON_RENDER_SIZE = '16x16';

export function buildRichMarkdownLink(
	metadata: ResolvedUrlMetadata,
	{ iconPosition, renderAsCard, showFavicon }: RichMarkdownLinkOptions,
): string {
	const { url, title, description } = metadata;
	const iconUrl = showFavicon ? metadata.iconUrl : null;

	if (renderAsCard) {
		return buildRichLinkCard({ url, title, description, iconUrl });
	}

	const safeTitle = escapeMarkdownText(title);

	const safeUrl = encodeLinkDestination(url);

	if (!iconUrl) {
		return `[${safeTitle}](<${encodeLinkDestination(url)}>)`;
	}

	const safeIconUrl = encodeLinkDestination(iconUrl);

	// The alt text tells styles.css which side of the title the favicon sits on,
	// so the "favicon spacing" setting can add its margin on the inner side.
	if (iconPosition === 'after-title') {
		const faviconMarkdown = `![favicon-after|${FAVICON_RENDER_SIZE}](<${safeIconUrl}>)`;

		return `[${safeTitle} ${faviconMarkdown}](<${safeUrl}>)`;
	}

	const faviconMarkdown = `![favicon|${FAVICON_RENDER_SIZE}](<${safeIconUrl}>)`;

	return `[${faviconMarkdown} ${safeTitle}](<${safeUrl}>)`;
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
	// Array.from keeps an emoji or other astral character in one piece.
	const safeFallbackInitial = escapeHtmlText(
		Array.from(title.trim())[0]?.toUpperCase() ?? '',
	);
	const visualIcon = safeIconUrl
		? `<img src="${safeIconUrl}" alt="" class="rich-link-card__visual-icon">`
		: `<span class="rich-link-card__visual-fallback">${safeFallbackInitial}</span>`;
	const footerIcon = safeIconUrl
		? `<img src="${safeIconUrl}" alt="" class="rich-link-card__favicon">`
		: '';
	const descriptionMarkup = safeDescription
		? `\n\t\t<p class="rich-link-card__description">${safeDescription}</p>`
		: '';

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
	return (
		value
			.trim()
			.replace(/\r?\n+/g, ' ')
			// Characters that start emphasis, links, code, math, HTML or a table cell.
			.replace(/[\\`*_[\]|<>$]/g, '\\$&')
			// Obsidian-specific pairs: ~~strike~~, ==highlight==, %%comment%%.
			.replace(/([~=%])\1/g, '\\$1\\$1')
			// `#word` would become a tag.
			.replace(/(^|\s)#(?=\S)/g, '$1\\#')
	);
}

// Inside `<...>` a link destination cannot contain `<`, `>` or a backslash
// that precedes the closing `>`; percent-encoding keeps the URL equivalent.
function encodeLinkDestination(url: string): string {
	return url.replace(/[<>\\]/g, (character) => encodeURIComponent(character));
}

function escapeHtmlText(value: string): string {
	return value
		.trim()
		.replace(/\r?\n+/g, ' ')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

function escapeHtmlAttribute(value: string): string {
	return escapeHtmlText(value).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatHostname(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}
