import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	buildIgnoreRules,
	shouldIgnoreUrl,
} from '../src/shared/ignore-rules/index.ts';

function ignored(url: string, domains = '', urls = '') {
	return shouldIgnoreUrl(
		url,
		buildIgnoreRules({ ignoredDomainsRaw: domains, ignoredUrlsRaw: urls }),
	);
}

describe('ignored domains', () => {
	it('matches the domain and its subdomains, not look-alikes', () => {
		assert.equal(ignored('https://example.com/x', 'example.com'), true);
		assert.equal(
			ignored('https://docs.example.com/x', 'example.com'),
			true,
		);
		assert.equal(ignored('https://notexample.com/x', 'example.com'), false);
		assert.equal(
			ignored('https://example.com.evil.io/x', 'example.com'),
			false,
		);
	});

	it('does not match the parent domain of a subdomain rule', () => {
		assert.equal(
			ignored('https://example.com/x', 'docs.example.com'),
			false,
		);
	});

	it('is case-insensitive and tolerates dots and spaces', () => {
		assert.equal(ignored('https://example.com', ' Example.COM/ '), true);
		assert.equal(ignored('https://example.com', '.example.com'), true);
	});

	it('accepts a pasted URL as the rule', () => {
		assert.equal(
			ignored('https://example.com/x', 'https://example.com'),
			true,
		);
		assert.equal(
			ignored('https://example.com/x', 'https://example.com/'),
			true,
		);
	});

	it('accepts a *. wildcard prefix', () => {
		assert.equal(
			ignored('https://docs.example.com/x', '*.example.com'),
			true,
		);
		assert.equal(ignored('https://example.com/x', '*.example.com'), true);
	});

	it('handles one rule per line, CRLF and blank lines', () => {
		const domains = 'a.com\r\n\r\n  b.com  \n';
		assert.equal(ignored('https://b.com', domains), true);
		assert.equal(ignored('https://c.com', domains), false);
	});

	it('drops invalid rules instead of matching everything', () => {
		assert.equal(ignored('https://example.com', 'not a domain'), false);
		assert.equal(ignored('https://example.com', 'example.com/path'), false);
		assert.equal(ignored('https://example.com', ''), false);
	});
});

describe('ignored URLs', () => {
	it('matches the exact URL only', () => {
		assert.equal(
			ignored('https://a.com/docs', '', 'https://a.com/docs'),
			true,
		);
		assert.equal(
			ignored('https://a.com/docs/x', '', 'https://a.com/docs'),
			false,
		);
	});

	it('treats a bare origin and its trailing-slash form as the same URL', () => {
		assert.equal(ignored('https://a.com', '', 'https://a.com/'), true);
	});

	it('never ignores something that is not an http(s) URL', () => {
		assert.equal(ignored('not a url', 'example.com', ''), false);
		assert.equal(ignored('ftp://example.com', 'example.com', ''), false);
	});
});
