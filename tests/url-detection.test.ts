import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	findUrlToResolve,
	isUrlAloneOnLine,
	normalizeClipboardUrl,
} from '../src/shared/url-detection/index.ts';
import { fakeEditor, textOf } from './helpers/fake-editor.ts';

function atCursor(text: string, cursor: number, preferredUrl?: string) {
	const editor = fakeEditor(text, cursor);
	const match = findUrlToResolve(editor, preferredUrl);
	return match && { url: match.url, replaced: textOf(editor, match) };
}

function selected(text: string, from: number, to: number) {
	const editor = fakeEditor(text, from, to);
	const match = findUrlToResolve(editor);
	return match && { url: match.url, replaced: textOf(editor, match) };
}

describe('normalizeClipboardUrl', () => {
	it('accepts a plain http(s) URL and trims whitespace', () => {
		assert.equal(
			normalizeClipboardUrl('  https://a.com/x \n'),
			'https://a.com/x',
		);
	});

	it('unwraps an angle-bracket autolink', () => {
		assert.equal(normalizeClipboardUrl('<https://a.com>'), 'https://a.com');
	});

	it('rejects empty values, other schemes and several words', () => {
		assert.equal(normalizeClipboardUrl(''), null);
		assert.equal(normalizeClipboardUrl(null), null);
		assert.equal(normalizeClipboardUrl('ftp://a.com'), null);
		assert.equal(normalizeClipboardUrl('mailto:a@b.com'), null);
		assert.equal(normalizeClipboardUrl('https://a.com and more'), null);
	});

	it('rejects strings that only look like a scheme', () => {
		assert.equal(normalizeClipboardUrl('http:example.com'), null);
		assert.equal(normalizeClipboardUrl('https:/example.com'), null);
		assert.equal(normalizeClipboardUrl('https://'), null);
	});
});

describe('findUrlToResolve: URL under the cursor', () => {
	it('finds a URL and leaves trailing sentence punctuation out', () => {
		assert.deepEqual(atCursor('see https://a.com/x. Next', 8), {
			url: 'https://a.com/x',
			replaced: 'https://a.com/x',
		});
	});

	it('keeps balanced parentheses but drops an unbalanced closing one', () => {
		assert.equal(
			atCursor('https://en.wikipedia.org/wiki/Foo_(bar)', 5)?.url,
			'https://en.wikipedia.org/wiki/Foo_(bar)',
		);
		assert.equal(
			atCursor('(see https://a.com/x)', 8)?.url,
			'https://a.com/x',
		);
	});

	it('keeps apostrophes inside the URL', () => {
		assert.equal(
			atCursor("go https://en.wikipedia.org/wiki/Rock_'n'_Roll ok", 6)
				?.url,
			"https://en.wikipedia.org/wiki/Rock_'n'_Roll",
		);
	});

	it('keeps square brackets and braces inside the URL', () => {
		assert.equal(
			atCursor('go https://x.com/?a[]=1&b=2 ok', 6)?.url,
			'https://x.com/?a[]=1&b=2',
		);
		assert.equal(
			atCursor('go https://x.com/{id}/z ok', 6)?.url,
			'https://x.com/{id}/z',
		);
	});

	it('drops quotes and brackets that merely surround the URL', () => {
		assert.equal(
			atCursor("say 'https://a.com' now", 8)?.url,
			'https://a.com',
		);
		assert.equal(
			atCursor('say "https://a.com" now', 8)?.url,
			'https://a.com',
		);
		assert.equal(
			atCursor('say [https://a.com] now', 8)?.url,
			'https://a.com',
		);
	});

	it('replaces the whole <autolink>, brackets included', () => {
		assert.deepEqual(atCursor('see <https://a.com> now', 10), {
			url: 'https://a.com',
			replaced: '<https://a.com>',
		});
	});

	it('returns null when the cursor is not on a URL', () => {
		assert.equal(atCursor('see https://a.com now', 1), null);
	});

	it('uses the preferred URL when the cursor is elsewhere on the line', () => {
		assert.deepEqual(atCursor('a https://a.com b', 0, 'https://a.com'), {
			url: 'https://a.com',
			replaced: 'https://a.com',
		});
	});
});

describe('findUrlToResolve: selected URL', () => {
	it('replaces exactly the selected URL', () => {
		assert.deepEqual(selected('see https://a.com now', 4, 17), {
			url: 'https://a.com',
			replaced: 'https://a.com',
		});
	});

	it('ignores whitespace around the selection', () => {
		assert.deepEqual(selected('see  https://a.com  now', 3, 19), {
			url: 'https://a.com',
			replaced: 'https://a.com',
		});
	});

	it('replaces a selected <autolink> as a whole', () => {
		assert.deepEqual(selected('see <https://a.com> now', 4, 19), {
			url: 'https://a.com',
			replaced: '<https://a.com>',
		});
	});

	it('replaces the autolink when only the URL inside it is selected', () => {
		assert.deepEqual(selected('see <https://a.com> now', 5, 18), {
			url: 'https://a.com',
			replaced: '<https://a.com>',
		});
	});

	it('does not treat plain text as a URL', () => {
		assert.equal(selected('see hello now', 4, 9), null);
	});
});

describe('isUrlAloneOnLine', () => {
	it('is true when only whitespace surrounds the range', () => {
		assert.equal(isUrlAloneOnLine('  https://a.com  ', 2, 15), true);
		assert.equal(isUrlAloneOnLine('https://a.com', 0, 13), true);
	});

	it('is false when other text shares the line', () => {
		assert.equal(isUrlAloneOnLine('see https://a.com', 4, 17), false);
		assert.equal(isUrlAloneOnLine('https://a.com now', 0, 13), false);
		assert.equal(isUrlAloneOnLine('- https://a.com', 2, 15), false);
		assert.equal(isUrlAloneOnLine('> https://a.com', 2, 15), false);
	});
});
