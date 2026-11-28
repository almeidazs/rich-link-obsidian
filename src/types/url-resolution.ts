export interface PageResponse {
	status: number;
	text: string;
}

export interface ResolvedUrlMetadata {
	url: string;
	title: string;
	description: string | null;
	iconUrl: string | null;
}
