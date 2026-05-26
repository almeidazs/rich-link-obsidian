import { requestUrl } from "obsidian";

const REQUEST_HEADERS = {
	Accept: "text/html,application/xhtml+xml",
	"User-Agent":
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
};

const TITLE_SELECTORS = [
	'meta[property="og:title"]',
	'meta[name="twitter:title"]',
	"title",
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

export interface ResolvedUrlMetadata {
	url: string;
	title: string;
	description: string | null;
	iconUrl: string | null;
}

export async function resolveUrlMetadata(
	url: string,
): Promise<ResolvedUrlMetadata> {
	const fallback = buildFallbackMetadata(url);

	try {
		const response = await requestUrl({
			url,
			headers: REQUEST_HEADERS,
			throw: false,
		});

		const baseUrl = extractBaseUrl(response.text, url) ?? url;
		const title = extractTitle(response.text) ?? fallback.title;
		const description = extractDescription(response.text);
		const iconUrl = extractIconUrl(response.text, baseUrl) ?? fallback.iconUrl;

		return {
			url,
			title,
			description,
			iconUrl,
		};
	} catch {
		return fallback;
	}
}

function buildFallbackMetadata(url: string): ResolvedUrlMetadata {
	const parsedUrl = new URL(url);
	const title = parsedUrl.hostname.replace(/^www\./, "");

	return {
		url,
		title,
		description: null,
		iconUrl: buildGoogleFaviconUrl(url),
	};
}

function extractTitle(html: string): string | null {
	const parsedDocument = parseHtml(html);
	const documentTitle = parsedDocument
		? extractTitleFromDocument(parsedDocument)
		: null;

	if (documentTitle) {
		return documentTitle;
	}

	return (
		extractMetaContent(html, "property", "og:title") ??
		extractMetaContent(html, "name", "twitter:title") ??
		extractTagText(html, "title")
	);
}

function extractDescription(html: string): string | null {
	const parsedDocument = parseHtml(html);
	const documentDescription = parsedDocument
		? extractDescriptionFromDocument(parsedDocument)
		: null;

	if (documentDescription) {
		return documentDescription;
	}

	return (
		extractMetaContent(html, "property", "og:description") ??
		extractMetaContent(html, "name", "twitter:description") ??
		extractMetaContent(html, "name", "description")
	);
}

function extractIconUrl(html: string, baseUrl: string): string | null {
	const parsedDocument = parseHtml(html);
	const documentIcon = parsedDocument
		? extractIconUrlFromDocument(parsedDocument, baseUrl)
		: null;

	if (documentIcon) {
		return documentIcon;
	}

	const iconHref =
		extractLinkHref(html, /icon/i) ??
		extractLinkHref(html, /shortcut icon/i) ??
		extractLinkHref(html, /apple-touch-icon/i) ??
		extractLinkHref(html, /mask-icon/i);

	if (iconHref) {
		return resolveUrl(iconHref, baseUrl);
	}

	try {
		return new URL("/favicon.ico", baseUrl).href;
	} catch {
		return null;
	}
}

function extractBaseUrl(html: string, fallbackUrl: string): string | null {
	const parsedDocument = parseHtml(html);
	const documentBase = parsedDocument
		?.querySelector("base[href]")
		?.getAttribute("href");

	if (documentBase) {
		return resolveUrl(documentBase, fallbackUrl);
	}

	const regexBase = extractTagAttribute(html, "base", "href");
	if (regexBase) {
		return resolveUrl(regexBase, fallbackUrl);
	}

	return null;
}

function extractTitleFromDocument(document: Document): string | null {
	for (const selector of TITLE_SELECTORS) {
		const element = document.querySelector(selector);
		const rawValue =
			selector === "title"
				? element?.textContent
				: element?.getAttribute("content");
		const sanitizedValue = sanitizeText(rawValue);

		if (sanitizedValue) {
			return sanitizedValue;
		}
	}

	return null;
}

function extractDescriptionFromDocument(document: Document): string | null {
	for (const selector of DESCRIPTION_SELECTORS) {
		const sanitizedValue = sanitizeText(
			document.querySelector(selector)?.getAttribute("content"),
		);

		if (sanitizedValue) {
			return sanitizedValue;
		}
	}

	return null;
}

function extractIconUrlFromDocument(
	document: Document,
	baseUrl: string,
): string | null {
	for (const selector of ICON_SELECTORS) {
		const href = document.querySelector(selector)?.getAttribute("href");
		if (href) {
			return resolveUrl(href, baseUrl);
		}
	}

	return null;
}

function parseHtml(html: string): Document | null {
	if (typeof DOMParser === "undefined") {
		return null;
	}

	return new DOMParser().parseFromString(html, "text/html");
}

function resolveUrl(pathOrUrl: string, baseUrl: string): string | null {
	try {
		return new URL(pathOrUrl, baseUrl).href;
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

	const sanitizedValue = value.replace(/\s+/g, " ").trim();
	return sanitizedValue || null;
}

function extractMetaContent(
	html: string,
	attributeName: "property" | "name",
	attributeValue: string,
): string | null {
	const metaRegex = new RegExp(
		`<meta[^>]*${attributeName}\\s*=\\s*["']${escapeRegex(
			attributeValue,
		)}["'][^>]*content\\s*=\\s*["']([^"']+)["'][^>]*>`,
		"i",
	);
	const reverseMetaRegex = new RegExp(
		`<meta[^>]*content\\s*=\\s*["']([^"']+)["'][^>]*${attributeName}\\s*=\\s*["']${escapeRegex(
			attributeValue,
		)}["'][^>]*>`,
		"i",
	);

	return (
		sanitizeText(metaRegex.exec(html)?.[1]) ??
		sanitizeText(reverseMetaRegex.exec(html)?.[1])
	);
}

function extractLinkHref(html: string, relPattern: RegExp): string | null {
	const tagRegex = /<link\b[^>]*>/gi;

	for (const match of html.matchAll(tagRegex)) {
		const tag = match[0];
		const rel = extractAttribute(tag, "rel");
		const href = extractAttribute(tag, "href");

		if (!rel || !href || !relPattern.test(rel)) {
			continue;
		}

		return href.trim();
	}

	return null;
}

function extractTagText(html: string, tagName: string): string | null {
	const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");

	return sanitizeText(regex.exec(html)?.[1]);
}

function extractTagAttribute(
	html: string,
	tagName: string,
	attributeName: string,
): string | null {
	const tagRegex = new RegExp(`<${tagName}\\b[^>]*>`, "i");
	const tag = tagRegex.exec(html)?.[0];

	if (!tag) {
		return null;
	}

	return extractAttribute(tag, attributeName);
}

function extractAttribute(tag: string, attributeName: string): string | null {
	const attributeRegex = new RegExp(
		`${attributeName}\\s*=\\s*["']([^"']+)["']`,
		"i",
	);

	return sanitizeText(attributeRegex.exec(tag)?.[1]);
}

function escapeRegex(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
