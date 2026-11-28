import type { PageResponse, ResolvedUrlMetadata } from '../../types';

// Turns a fetched page into the metadata used for the rich link. It only needs
// DOMParser (always present in Obsidian) so it can be tested without Obsidian.

const TITLE_SELECTORS = [
	'meta[property="og:title"]',
	'meta[name="twitter:title"]',
	'title',
] as const;

const DESCRIPTION_SELECTORS = [
	'meta[property="og:description"]',
	'meta[name="twitter:description"]',
	'meta[name="description"]',
] as const;

const ICON_SELECTORS = [
	'link[rel~="icon"]',
	'link[rel="shortcut icon"]',
	'link[rel="apple-touch-icon"]',
	'link[rel="mask-icon"]',
] as const;

export function buildMetadata(
	url: string,
	response: PageResponse | null,
): ResolvedUrlMetadata {
	const fallback = buildFallbackMetadata(url);

	// An error page ("404", "Just a moment...") says nothing about the target.
	if (!response || response.status >= 400 || !response.text) {
		return fallback;
	}

	const document = parseHtml(response.text);
	if (!document) {
		return fallback;
	}

	const baseUrl = findBaseUrl(document, url) ?? url;

	return {
		url,
		title: findText(document, TITLE_SELECTORS) ?? fallback.title,
		description: findText(document, DESCRIPTION_SELECTORS),
		iconUrl: findIconUrl(document, baseUrl) ?? fallback.iconUrl,
	};
}

function buildFallbackMetadata(url: string): ResolvedUrlMetadata {
	try {
		return {
			url,
			title: new URL(url).hostname.replace(/^www\./, ''),
			description: null,
			iconUrl: buildGoogleFaviconUrl(url),
		};
	} catch {
		return { url, title: url, description: null, iconUrl: null };
	}
}

function parseHtml(html: string): Document | null {
	if (typeof DOMParser === 'undefined') {
		return null;
	}

	try {
		return new DOMParser().parseFromString(html, 'text/html');
	} catch {
		return null;
	}
}

function findText(
	document: Document,
	selectors: readonly string[],
): string | null {
	for (const selector of selectors) {
		for (const element of document.querySelectorAll(selector)) {
			const value = sanitizeText(
				element.localName === 'meta'
					? element.getAttribute('content')
					: element.textContent,
			);

			if (value) {
				return value;
			}
		}
	}

	return null;
}

function findBaseUrl(document: Document, pageUrl: string): string | null {
	const href = document.querySelector('base[href]')?.getAttribute('href');

	return href ? resolveHttpUrl(href, pageUrl) : null;
}

// The first declared icon with a usable http(s) URL wins. `data:` icons
// (including the `data:,` "no icon" trick) can't go in a markdown link.
function findIconUrl(document: Document, baseUrl: string): string | null {
	for (const selector of ICON_SELECTORS) {
		for (const element of document.querySelectorAll(selector)) {
			const href = element.getAttribute('href');
			const iconUrl = href ? resolveHttpUrl(href, baseUrl) : null;

			if (iconUrl) {
				return iconUrl;
			}
		}
	}

	return resolveHttpUrl('/favicon.ico', baseUrl);
}

function resolveHttpUrl(pathOrUrl: string, baseUrl: string): string | null {
	try {
		const resolved = new URL(pathOrUrl.trim(), baseUrl);

		return resolved.protocol === 'http:' || resolved.protocol === 'https:'
			? resolved.href
			: null;
	} catch {
		return null;
	}
}

function buildGoogleFaviconUrl(url: string): string {
	return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
		url,
	)}`;
}

function sanitizeText(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const sanitizedValue = value.replace(/\s+/g, ' ').trim();
	return sanitizedValue || null;
}
