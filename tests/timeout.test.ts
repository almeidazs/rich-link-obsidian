import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TimeoutError, withTimeout } from "../src/shared/timeout/index.ts";

describe("withTimeout", () => {
	it("resolves with the value when the promise wins", async () => {
		assert.equal(await withTimeout(Promise.resolve(42), 50), 42);
	});

	it("rejects with TimeoutError when the promise is too slow", async () => {
		const slow = new Promise<number>((resolve) => setTimeout(() => resolve(1), 200));
		await assert.rejects(withTimeout(slow, 10), TimeoutError);
	});

	it("propagates the original rejection", async () => {
		await assert.rejects(withTimeout(Promise.reject(new Error("boom")), 50), /boom/);
	});

	it("does not leave a pending timer behind after resolving", async () => {
		await withTimeout(Promise.resolve(1), 60_000);
	});
});
