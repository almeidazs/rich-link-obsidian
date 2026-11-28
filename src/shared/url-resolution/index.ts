import { requestUrl } from 'obsidian';

import type { PageResponse, ResolvedUrlMetadata } from '../../types';
import { buildMetadata } from '../html-metadata';
import { withTimeout } from '../timeout';

const REQUEST_TIMEOUT_MS = 10_000;

const REQUEST_HEADERS = {
	Accept: 'text/html,application/xhtml+xml',
	'User-Agent':
		'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
};

export async function resolveUrlMetadata(
	url: string,
): Promise<ResolvedUrlMetadata> {
	return buildMetadata(url, await fetchPage(url));
}

// Never throws: a slow, unreachable or odd response just means "no metadata",
// and the caller falls back to the hostname instead of leaving the placeholder.
async function fetchPage(url: string): Promise<PageResponse | null> {
	try {
		const response = await withTimeout(
			requestUrl({ url, headers: REQUEST_HEADERS, throw: false }),
			REQUEST_TIMEOUT_MS,
		);

		return { status: response.status, text: response.text };
	} catch {
		return null;
	}
}
