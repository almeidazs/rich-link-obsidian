import type { IgnoreRules, IgnoreRulesSettings } from "../../types";

export function buildIgnoreRules(settings: IgnoreRulesSettings): IgnoreRules {
	return {
		domains: parseIgnoredDomains(settings.ignoredDomainsRaw),
		exactUrls: parseIgnoredUrls(settings.ignoredUrlsRaw),
	};
}

export function shouldIgnoreUrl(url: string, rules: IgnoreRules): boolean {
	const normalizedUrl = normalizeHttpUrl(url);

	if (!normalizedUrl) {
		return false;
	}

	if (rules.exactUrls.includes(normalizedUrl)) {
		return true;
	}

	const hostname = new URL(normalizedUrl).hostname.toLowerCase();
	return rules.domains.some((domain) => matchesDomainRule(hostname, domain));
}

function parseIgnoredDomains(value: string): string[] {
	return extractNonEmptyLines(value)
		.map(normalizeDomainRule)
		.filter((domain): domain is string => domain !== null);
}

function parseIgnoredUrls(value: string): string[] {
	return extractNonEmptyLines(value)
		.map(normalizeHttpUrl)
		.filter((url): url is string => url !== null);
}

function extractNonEmptyLines(value: string): string[] {
	return value
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function normalizeDomainRule(value: string): string | null {
	// Accept what people actually type: a pasted URL, `*.example.com`, stray dots.
	const candidate = value
		.trim()
		.toLowerCase()
		.replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
		.replace(/^\*\./, "")
		.replace(/^\.+|\.+$/g, "");

	if (!candidate || /\s/.test(candidate)) {
		return null;
	}

	try {
		const normalizedUrl = new URL(`https://${candidate}`);
		if (
			normalizedUrl.pathname !== "/" ||
			normalizedUrl.search ||
			normalizedUrl.hash
		) {
			return null;
		}

		return normalizedUrl.hostname.toLowerCase();
	} catch {
		return null;
	}
}

function normalizeHttpUrl(value: string): string | null {
	try {
		const parsedUrl = new URL(value);
		if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
			return null;
		}

		return parsedUrl.href;
	} catch {
		return null;
	}
}

function matchesDomainRule(hostname: string, domainRule: string): boolean {
	return hostname === domainRule || hostname.endsWith(`.${domainRule}`);
}
