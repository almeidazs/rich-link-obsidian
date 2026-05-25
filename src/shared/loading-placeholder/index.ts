const ZERO_WIDTH_ZERO = "\u200b";
const ZERO_WIDTH_ONE = "\u200c";
const ZERO_WIDTH_PREFIX = "\u2063";

export function buildLoadingMarkdownLink(url: string): string {
	const invisibleToken = buildInvisibleToken();
	return `[Loading URL...${invisibleToken}](<${url}>)`;
}

function buildInvisibleToken(): string {
	const randomBytes = crypto.getRandomValues(new Uint8Array(6));
	const bits = Array.from(randomBytes, (value) =>
		value.toString(2).padStart(8, "0"),
	).join("");

	return (
		ZERO_WIDTH_PREFIX +
		bits.split("0").join(ZERO_WIDTH_ZERO).split("1").join(ZERO_WIDTH_ONE)
	);
}
