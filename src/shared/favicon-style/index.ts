import type { RichLinkResolverSettings } from "../../types";

const PROPERTIES = {
	size: "--rich-link-favicon-size",
	spacing: "--rich-link-favicon-spacing",
	offset: "--rich-link-favicon-offset",
} as const;

// styles.css reads these variables, so changing a setting restyles every
// favicon already in your notes, not just the ones created afterwards.
export function applyFaviconStyles(
	settings: Pick<
		RichLinkResolverSettings,
		"faviconSize" | "faviconSpacing" | "faviconOffset"
	>,
): void {
	const { style } = document.body;

	style.setProperty(PROPERTIES.size, `${settings.faviconSize}px`);
	style.setProperty(PROPERTIES.spacing, `${settings.faviconSpacing}px`);
	style.setProperty(PROPERTIES.offset, `${settings.faviconOffset}px`);
}

export function clearFaviconStyles(): void {
	const { style } = document.body;

	for (const property of Object.values(PROPERTIES)) {
		style.removeProperty(property);
	}
}
