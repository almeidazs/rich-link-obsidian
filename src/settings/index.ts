import { type App, type Plugin, PluginSettingTab, Setting } from "obsidian";

export const ICON_POSITIONS = ["before-title", "after-title"] as const;

export type IconPosition = (typeof ICON_POSITIONS)[number];

export interface RichLinkResolverSettings {
	iconPosition: IconPosition;
	ignoredDomainsRaw: string;
	ignoredUrlsRaw: string;
}

export const DEFAULT_SETTINGS: RichLinkResolverSettings = {
	iconPosition: "before-title",
	ignoredDomainsRaw: "",
	ignoredUrlsRaw: "",
};

export async function loadPluginSettings(
	plugin: Plugin,
): Promise<RichLinkResolverSettings> {
	const savedData = await plugin.loadData();

	return normalizeSettings(savedData);
}

export async function savePluginSettings(
	plugin: Plugin,
	settings: RichLinkResolverSettings,
): Promise<RichLinkResolverSettings> {
	const normalizedSettings = normalizeSettings(settings);
	await plugin.saveData(normalizedSettings);

	return normalizedSettings;
}

export class RichLinkResolverSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: RichLinkResolverSettingsOwner,
	) {
		super(app, plugin);
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Icon position")
			.setDesc(
				"Choose whether the favicon appears before or after the link title.",
			)
			.addDropdown((dropdown) => {
				dropdown
					.addOption("before-title", "Before title")
					.addOption("after-title", "After title")
					.setValue(this.plugin.settings.iconPosition)
					.onChange(async (value) => {
						if (!isIconPosition(value)) {
							return;
						}

						this.plugin.settings.iconPosition = value;
						await this.plugin.persistSettings();
					});
			});

		new Setting(containerEl)
			.setName("Ignored domains")
			.setDesc(
				"One domain per line. Matches the exact domain and its subdomains.",
			)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("example.com")
					.setValue(this.plugin.settings.ignoredDomainsRaw)
					.onChange(async (value) => {
						this.plugin.settings.ignoredDomainsRaw = value;
						await this.plugin.persistSettings();
					});

				textArea.inputEl.rows = 8;
				textArea.inputEl.cols = 40;
			});

		new Setting(containerEl)
			.setName("Ignored URLs")
			.setDesc("One exact HTTP or HTTPS URL per line.")
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("https://example.com/docs")
					.setValue(this.plugin.settings.ignoredUrlsRaw)
					.onChange(async (value) => {
						this.plugin.settings.ignoredUrlsRaw = value;
						await this.plugin.persistSettings();
					});

				textArea.inputEl.rows = 8;
				textArea.inputEl.cols = 40;
			});
	}
}

interface RichLinkResolverSettingsOwner extends Plugin {
	settings: RichLinkResolverSettings;
	persistSettings(): Promise<void>;
}

function normalizeSettings(value: unknown): RichLinkResolverSettings {
	const settingsRecord = isRecord(value) ? value : {};

	return {
		iconPosition: normalizeIconPosition(settingsRecord.iconPosition),
		ignoredDomainsRaw: normalizeMultilineText(settingsRecord.ignoredDomainsRaw),
		ignoredUrlsRaw: normalizeMultilineText(settingsRecord.ignoredUrlsRaw),
	};
}

function normalizeIconPosition(value: unknown): IconPosition {
	return isIconPosition(value) ? value : DEFAULT_SETTINGS.iconPosition;
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

function isIconPosition(value: unknown): value is IconPosition {
	return ICON_POSITIONS.includes(value as IconPosition);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}
