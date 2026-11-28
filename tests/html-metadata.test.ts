import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "./helpers/dom.ts";
import { buildMetadata } from "../src/shared/html-metadata/index.ts";

const URL_ = "https://www.example.com/post/1";
const GOOGLE_ICON = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(URL_)}`;

function page(head: string, status = 200) {
	return { status, text: `<!doctype html><html><head>${head}</head><body></body></html>` };
}

describe("buildMetadata: fallback", () => {
	it("falls back to the hostname and Google's favicon service without a response", () => {
		assert.deepEqual(buildMetadata(URL_, null), {
			url: URL_,
			title: "example.com",
			description: null,
			iconUrl: GOOGLE_ICON,
		});
	});

	it("falls back for HTTP error responses instead of using the error page", () => {
		for (const status of [403, 404, 429, 500, 503]) {
			const result = buildMetadata(URL_, page("<title>Just a moment...</title>", status));
			assert.equal(result.title, "example.com", `status ${status}`);
			assert.equal(result.iconUrl, GOOGLE_ICON, `status ${status}`);
		}
	});

	it("falls back to the hostname when the page has no title", () => {
		assert.equal(buildMetadata(URL_, page("")).title, "example.com");
	});

	it("falls back for an empty body", () => {
		assert.equal(buildMetadata(URL_, { status: 200, text: "" }).title, "example.com");
	});
});

describe("buildMetadata: title and description", () => {
	it("prefers og:title, then twitter:title, then <title>", () => {
		assert.equal(
			buildMetadata(URL_, page('<title>T</title><meta name="twitter:title" content="TW"><meta property="og:title" content="OG">')).title,
			"OG",
		);
		assert.equal(
			buildMetadata(URL_, page('<title>T</title><meta name="twitter:title" content="TW">')).title,
			"TW",
		);
		assert.equal(buildMetadata(URL_, page("<title>T</title>")).title, "T");
	});

	it("decodes entities, keeps apostrophes and collapses whitespace", () => {
		assert.equal(
			buildMetadata(URL_, page("<title>\n  Tom &amp; Jerry's \n show </title>")).title,
			"Tom & Jerry's show",
		);
		assert.equal(
			buildMetadata(URL_, page('<meta property="og:title" content="It&#39;s \'quoted\'">')).title,
			"It's 'quoted'",
		);
	});

	it("reads the description with the same priority", () => {
		const html = '<meta name="description" content="D"><meta property="og:description" content="OGD">';
		assert.equal(buildMetadata(URL_, page(html)).description, "OGD");
		assert.equal(buildMetadata(URL_, page('<meta name="description" content="D">')).description, "D");
		assert.equal(buildMetadata(URL_, page("")).description, null);
	});
});

describe("buildMetadata: icon", () => {
	it("resolves relative, root-relative and protocol-relative hrefs", () => {
		assert.equal(buildMetadata(URL_, page('<link rel="icon" href="/i.png">')).iconUrl, "https://www.example.com/i.png");
		assert.equal(buildMetadata(URL_, page('<link rel="icon" href="i.png">')).iconUrl, "https://www.example.com/post/i.png");
		assert.equal(buildMetadata(URL_, page('<link rel="icon" href="//cdn.example.net/i.png">')).iconUrl, "https://cdn.example.net/i.png");
	});

	it("honours <base href> when resolving the icon", () => {
		assert.equal(
			buildMetadata(URL_, page('<base href="https://static.example.org/assets/"><link rel="icon" href="i.png">')).iconUrl,
			"https://static.example.org/assets/i.png",
		);
	});

	it("prefers rel=icon over apple-touch-icon and mask-icon", () => {
		const head = '<link rel="mask-icon" href="/m.svg"><link rel="apple-touch-icon" href="/a.png"><link rel="shortcut icon" href="/i.ico">';
		assert.equal(buildMetadata(URL_, page(head)).iconUrl, "https://www.example.com/i.ico");
	});

	it("falls back to apple-touch-icon when there is no plain icon", () => {
		assert.equal(buildMetadata(URL_, page('<link rel="apple-touch-icon" href="/a.png">')).iconUrl, "https://www.example.com/a.png");
	});

	it("skips data: and other non-http(s) icons", () => {
		const head = '<link rel="icon" href="data:,"><link rel="icon" href="data:image/svg+xml,<svg></svg>"><link rel="icon" href="/real.ico">';
		assert.equal(buildMetadata(URL_, page(head)).iconUrl, "https://www.example.com/real.ico");
		assert.equal(buildMetadata(URL_, page('<link rel="icon" href="data:,">')).iconUrl, "https://www.example.com/favicon.ico");
		assert.equal(buildMetadata(URL_, page('<link rel="icon" href="javascript:alert(1)">')).iconUrl, "https://www.example.com/favicon.ico");
	});

	it("guesses /favicon.ico when the page declares none", () => {
		assert.equal(buildMetadata(URL_, page("<title>T</title>")).iconUrl, "https://www.example.com/favicon.ico");
	});
});
