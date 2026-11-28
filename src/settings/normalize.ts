import {
	ICON_POSITIONS,
	type IconPosition,
	type NumberRange,
	type RichLinkResolverSettings,
} from "../types/settings.ts";

// Kept free of Obsidian imports so it can be unit-tested with `node --test`.

export const FAVICON_SIZE_RANGE: NumberRange = { min: 8, max: 48, step: 1 };
export const FAVICON_SPACING_RANGE: NumberRange = { min: 0, max: 16, step: 1 };
export const FAVICON_OFFSET_RANGE: NumberRange = { min: -8, max: 8, step: 1 };

export const DEFAULT_SETTINGS: RichLinkResolverSettings = {
	iconPosition: "before-title",
	renderAsCard: false,
	showFavicon: true,
	faviconSize: 16,
	faviconSpacing: 0,
	faviconOffset: 0,
	ignoredDomainsRaw: "",
	ignoredUrlsRaw: "",
};

export function normalizeSettings(value: unknown): RichLinkResolverSettings {
	const settingsRecord = isRecord(value) ? value : {};

	return {
		iconPosition: normalizeIconPosition(settingsRecord.iconPosition),
		renderAsCard: settingsRecord.renderAsCard === true,
		showFavicon: settingsRecord.showFavicon !== false,
		faviconSize: normalizeNumber(
			settingsRecord.faviconSize,
			FAVICON_SIZE_RANGE,
			DEFAULT_SETTINGS.faviconSize,
		),
		faviconSpacing: normalizeNumber(
			settingsRecord.faviconSpacing,
			FAVICON_SPACING_RANGE,
			DEFAULT_SETTINGS.faviconSpacing,
		),
		faviconOffset: normalizeNumber(
			settingsRecord.faviconOffset,
			FAVICON_OFFSET_RANGE,
			DEFAULT_SETTINGS.faviconOffset,
		),
		ignoredDomainsRaw: normalizeMultilineText(settingsRecord.ignoredDomainsRaw),
		ignoredUrlsRaw: normalizeMultilineText(settingsRecord.ignoredUrlsRaw),
	};
}

function normalizeIconPosition(value: unknown): IconPosition {
	return isIconPosition(value) ? value : DEFAULT_SETTINGS.iconPosition;
}

function normalizeNumber(
	value: unknown,
	range: NumberRange,
	fallback: number,
): number {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return fallback;
	}

	return Math.min(range.max, Math.max(range.min, Math.round(value)));
}

function normalizeMultilineText(value: unknown): string {
	if (typeof value !== "string") {
		return "";
	}

	return value
		.split(/\r?\n/)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.join("\n");
}

export function isIconPosition(value: unknown): value is IconPosition {
	return ICON_POSITIONS.includes(value as IconPosition);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
