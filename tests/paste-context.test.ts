import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findRichLinkBlocker } from "../src/shared/paste-context/index.ts";

// `textBeforeCursor` is the whole document from the start up to the cursor
// (or up to the URL's start, for the menu/command path). The helper only
// needs what comes *before* the cursor to know which context we are in.
function blocker(textBeforeCursor: string, selection = "") {
	return findRichLinkBlocker({ textBeforeCursor, selection });
}

describe("findRichLinkBlocker", () => {
	describe("plain text", () => {
		it("allows rich paste on an empty document", () => {
			assert.equal(blocker(""), null);
		});

		it("allows rich paste after ordinary text", () => {
			assert.equal(blocker("Some notes\nCheck this out: "), null);
		});

		it("allows rich paste after a completed markdown link", () => {
			assert.equal(blocker("[Hello](https://a.com) and "), null);
		});
	});

	describe("markdown link destination", () => {
		it("blocks right after `](`", () => {
			assert.equal(blocker("[Hello]("), "link-destination");
		});

		it("blocks right after `](<` (angle-bracket destination)", () => {
			assert.equal(blocker("[Hello](<"), "link-destination");
		});

		it("blocks when whitespace follows `](`", () => {
			assert.equal(blocker("See [Hello]( "), "link-destination");
		});
	});

	describe("selection", () => {
		it("blocks when the selection is plain text (user is wrapping it in a link)", () => {
			assert.equal(blocker("Intro ", "Hello"), "link-text-selection");
		});

		it("allows when the selection is itself a URL", () => {
			assert.equal(blocker("Intro ", "https://a.com"), null);
		});

		it("allows when the selection is a URL surrounded by whitespace", () => {
			assert.equal(blocker("Intro ", "  https://a.com "), null);
		});

		it("allows when the selection is only whitespace", () => {
			assert.equal(blocker("Intro ", "   "), null);
		});
	});

	describe("fenced code blocks", () => {
		it("blocks inside an open ``` fence", () => {
			assert.equal(blocker("```\nconst x = "), "fenced-code");
		});

		it("blocks inside an open ~~~ fence with an info string", () => {
			assert.equal(blocker("~~~js\n"), "fenced-code");
		});

		it("allows after the fence is closed", () => {
			assert.equal(blocker("```\ncode\n```\n"), null);
		});

		it("does not close a ``` fence with ~~~", () => {
			assert.equal(blocker("```\n~~~\n"), "fenced-code");
		});

		it("does not close a ```` fence with a shorter ```", () => {
			assert.equal(blocker("````\n```\n"), "fenced-code");
		});

		it("closes a ``` fence with a longer ````", () => {
			assert.equal(blocker("```\n````\n"), null);
		});

		it("treats a fence indented up to 3 spaces as a fence", () => {
			assert.equal(blocker("   ```\n"), "fenced-code");
		});

		it("ignores a ``` indented 4+ spaces (not a fence)", () => {
			assert.equal(blocker("    ```\n"), null);
		});

		it("handles multiple fences in one document", () => {
			assert.equal(blocker("```\na\n```\ntext\n```\n"), "fenced-code");
		});
	});

	describe("inline code", () => {
		it("blocks inside an unclosed backtick on the current line", () => {
			assert.equal(blocker("run `curl "), "inline-code");
		});

		it("allows after a closed inline code span", () => {
			assert.equal(blocker("run `x` then "), null);
		});

		it("blocks inside a double-backtick span containing a single backtick", () => {
			assert.equal(blocker("``a ` b "), "inline-code");
		});

		it("allows after a closed double-backtick span", () => {
			assert.equal(blocker("``a`` "), null);
		});

		it("only looks at the current line", () => {
			assert.equal(blocker("`a\nb "), null);
		});
	});
});
