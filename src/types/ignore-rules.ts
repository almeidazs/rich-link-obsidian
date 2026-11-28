import type { RichLinkResolverSettings } from './settings';

export interface IgnoreRules {
	domains: string[];
	exactUrls: string[];
}

export type IgnoreRulesSettings = Pick<
	RichLinkResolverSettings,
	'ignoredDomainsRaw' | 'ignoredUrlsRaw'
>;
