import type { Plugin } from 'obsidian';

export const ICON_POSITIONS = ['before-title', 'after-title'] as const;

export type IconPosition = (typeof ICON_POSITIONS)[number];

export interface RichLinkResolverSettings {
	iconPosition: IconPosition;
	renderAsCard: boolean;
	showFavicon: boolean;
	/** Rendered favicon width/height, in px. */
	faviconSize: number;
	/** Extra space between the favicon and the title, in px. */
	faviconSpacing: number;
	/** Vertical nudge of the favicon, in px (positive moves it up). */
	faviconOffset: number;
	ignoredDomainsRaw: string;
	ignoredUrlsRaw: string;
}

export interface NumberRange {
	readonly min: number;
	readonly max: number;
	readonly step: number;
}

export type FaviconNumberSetting =
	| 'faviconSize'
	| 'faviconSpacing'
	| 'faviconOffset';

export interface RichLinkResolverSettingsOwner extends Plugin {
	settings: RichLinkResolverSettings;
	persistSettings(): Promise<void>;
}
