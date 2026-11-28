import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildRichMarkdownLink } from "../src/shared/markdown-link/index.ts";

const metadata = {
	url: "https://example.com/page",
	title: "Example Domain",
	description: "An example page",
	iconUrl: "https://example.com/favicon.ico",
};

const defaults = {
	iconPosition: "before-title",
	renderAsCard: false,
	showFavicon: true,
} as const;

describe("buildRichMarkdownLink", () => {
	it("puts the favicon before the title by default", () => {
		assert.equal(
			buildRichMarkdownLink(metadata, defaults),
			"[![favicon|16x16](<https://example.com/favicon.ico>) Example Domain](<https://example.com/page>)",
		);
	});

	it("puts the favicon after the title and marks the side in the alt text", () => {
		assert.equal(
			buildRichMarkdownLink(metadata, {
				...defaults,
				iconPosition: "after-title",
			}),
			"[Example Domain ![favicon-after|16x16](<https://example.com/favicon.ico>)](<https://example.com/page>)",
		);
	});

	it("omits the favicon when showFavicon is off", () => {
		for (const iconPosition of ["before-title", "after-title"] as const) {
			assert.equal(
				buildRichMarkdownLink(metadata, {
					...defaults,
					iconPosition,
					showFavicon: false,
				}),
				"[Example Domain](<https://example.com/page>)",
			);
		}
	});

	it("falls back to a plain link when there is no icon URL", () => {
		assert.equal(
			buildRichMarkdownLink({ ...metadata, iconUrl: null }, defaults),
			"[Example Domain](<https://example.com/page>)",
		);
	});

	it("escapes markdown characters in the title", () => {
		assert.equal(
			buildRichMarkdownLink(
				{ ...metadata, title: "a [b] *c* _d_ | e", iconUrl: null },
				defaults,
			),
			"[a \\[b\\] \\*c\\* \\_d\\_ \\| e](<https://example.com/page>)",
		);
	});

	describe("escaping", () => {
		const link = (title: string, url = "https://example.com/page") =>
			buildRichMarkdownLink({ ...metadata, title, url, iconUrl: null }, defaults);

		it("escapes code, math, comment, highlight and strikethrough syntax", () => {
			assert.equal(link("Using `code` here"), "[Using \\`code\\` here](<https://example.com/page>)");
			assert.equal(link("Costs $5 and $10"), "[Costs \\$5 and \\$10](<https://example.com/page>)");
			assert.equal(link("a %%hidden%% b"), "[a \\%\\%hidden\\%\\% b](<https://example.com/page>)");
			assert.equal(link("==hi== ~~x~~"), "[\\=\\=hi\\=\\= \\~\\~x\\~\\~](<https://example.com/page>)");
		});

		it("escapes angle brackets so titles cannot inject HTML", () => {
			assert.equal(link("<b>bold</b>"), "[\\<b\\>bold\\</b\\>](<https://example.com/page>)");
		});

		it("escapes a leading hashtag but not a # inside a word", () => {
			assert.equal(link("#tag post"), "[\\#tag post](<https://example.com/page>)");
			assert.equal(link("see #tag"), "[see \\#tag](<https://example.com/page>)");
			assert.equal(link("C# and F#"), "[C# and F#](<https://example.com/page>)");
		});

		it("leaves single = ~ % characters alone", () => {
			assert.equal(link("a = b ~ c 100%"), "[a = b ~ c 100%](<https://example.com/page>)");
		});

		it("percent-encodes characters that would end the <destination>", () => {
			assert.equal(link("t", "https://e.com/a>b<c"), "[t](<https://e.com/a%3Eb%3Cc>)");
			assert.equal(link("t", "https://e.com/a\\"), "[t](<https://e.com/a%5C>)");
		});

		it("encodes the icon URL the same way", () => {
			assert.equal(
				buildRichMarkdownLink({ ...metadata, iconUrl: "https://e.com/i>.png" }, defaults),
				"[![favicon|16x16](<https://e.com/i%3E.png>) Example Domain](<https://example.com/page>)",
			);
		});
	});

	describe("cards", () => {
		it("renders the favicon image in the card by default", () => {
			const card = buildRichMarkdownLink(metadata, {
				...defaults,
				renderAsCard: true,
			});

			assert.match(card, /rich-link-card__favicon/);
			assert.match(card, /rich-link-card__visual-icon/);
		});

		it("drops every favicon image from the card when showFavicon is off", () => {
			const card = buildRichMarkdownLink(metadata, {
				...defaults,
				renderAsCard: true,
				showFavicon: false,
			});

			assert.doesNotMatch(card, /<img/);
			assert.match(card, /rich-link-card__visual-fallback/);
		});

		it("uses the whole first character, even an emoji, as the fallback initial", () => {
			const card = buildRichMarkdownLink(
				{ ...metadata, title: "\u{1F600} Site", iconUrl: null },
				{ ...defaults, renderAsCard: true },
			);

			assert.match(card, /rich-link-card__visual-fallback">\u{1F600}</u);
		});
	});
});
