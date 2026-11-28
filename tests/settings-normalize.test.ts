import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	DEFAULT_SETTINGS,
	normalizeSettings,
} from '../src/settings/normalize.ts';

describe('normalizeSettings', () => {
	it('returns the defaults for missing or garbage data', () => {
		for (const value of [undefined, null, 42, 'x', [], {}]) {
			assert.deepEqual(normalizeSettings(value), DEFAULT_SETTINGS);
		}
	});

	it('keeps valid values', () => {
		const saved = {
			iconPosition: 'after-title',
			renderAsCard: true,
			showFavicon: false,
			faviconSize: 24,
			faviconSpacing: 4,
			faviconOffset: -2,
			ignoredDomainsRaw: 'a.com',
			ignoredUrlsRaw: 'https://b.com/x',
		};
		assert.deepEqual(normalizeSettings(saved), saved);
	});

	it('keeps showFavicon on unless it is explicitly false (older saves lack it)', () => {
		assert.equal(normalizeSettings({}).showFavicon, true);
		assert.equal(
			normalizeSettings({ showFavicon: 'no' }).showFavicon,
			true,
		);
		assert.equal(
			normalizeSettings({ showFavicon: false }).showFavicon,
			false,
		);
	});

	it('clamps and rounds the numeric favicon settings', () => {
		const low = normalizeSettings({
			faviconSize: 1,
			faviconSpacing: -5,
			faviconOffset: -99,
		});
		assert.deepEqual(
			[low.faviconSize, low.faviconSpacing, low.faviconOffset],
			[8, 0, -8],
		);

		const high = normalizeSettings({
			faviconSize: 500,
			faviconSpacing: 99,
			faviconOffset: 99,
		});
		assert.deepEqual(
			[high.faviconSize, high.faviconSpacing, high.faviconOffset],
			[48, 16, 8],
		);

		assert.equal(normalizeSettings({ faviconSize: 15.6 }).faviconSize, 16);
	});

	it('falls back to defaults for non-numeric favicon values', () => {
		for (const bad of ['20', NaN, Infinity, null, {}]) {
			assert.equal(
				normalizeSettings({ faviconSize: bad }).faviconSize,
				16,
			);
		}
	});

	it('rejects an unknown icon position', () => {
		assert.equal(
			normalizeSettings({ iconPosition: 'middle' }).iconPosition,
			'before-title',
		);
	});

	it('trims lines and drops blank ones in the ignore lists', () => {
		assert.equal(
			normalizeSettings({ ignoredDomainsRaw: '  a.com \r\n\r\n b.com\n' })
				.ignoredDomainsRaw,
			'a.com\nb.com',
		);
		assert.equal(
			normalizeSettings({ ignoredUrlsRaw: 5 }).ignoredUrlsRaw,
			'',
		);
	});
});
