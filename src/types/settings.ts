import type { Plugin } from "obsidian";

export const ICON_POSITIONS = ["before-title", "after-title"] as const;

export type IconPosition = (typeof ICON_POSITIONS)[number];

export interface RichLinkResolverSettings {
	iconPosition: IconPosition;
	renderAsCard: boolean;
	ignoredDomainsRaw: string;
	ignoredUrlsRaw: string;
}

export interface RichLinkResolverSettingsOwner extends Plugin {
	settings: RichLinkResolverSettings;
	persistSettings(): Promise<void>;
}
