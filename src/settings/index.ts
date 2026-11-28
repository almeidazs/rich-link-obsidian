import {
	type App,
	debounce,
	type Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import { applyFaviconStyles } from "../shared/favicon-style";
import {
	type FaviconNumberSetting,
	type NumberRange,
	type RichLinkResolverSettings,
	type RichLinkResolverSettingsOwner,
} from "../types";
import {
	DEFAULT_SETTINGS,
	FAVICON_OFFSET_RANGE,
	FAVICON_SIZE_RANGE,
	FAVICON_SPACING_RANGE,
	isIconPosition,
	normalizeSettings,
} from "./normalize";

export async function loadPluginSettings(
	plugin: Plugin,
): Promise<RichLinkResolverSettings> {
	const savedData = await plugin.loadData();

	return normalizeSettings(savedData);
}

export async function savePluginSettings(
	plugin: Plugin,
	settings: RichLinkResolverSettings,
): Promise<void> {
	await plugin.saveData(settings);
}

export class RichLinkResolverSettingTab extends PluginSettingTab {
	// Sliders and text areas fire on every tick or keystroke; write to disk once
	// the user pauses instead of on each one.
	private readonly saveSoon = debounce(
		() => {
			void this.plugin.persistSettings();
		},
		400,
		true,
	);

	constructor(
		app: App,
		private readonly plugin: RichLinkResolverSettingsOwner,
	) {
		super(app, plugin);
	}

	override hide(): void {
		this.saveSoon.run();
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
			.setName("Render links as cards")
			.setDesc(
				"When enabled, resolved URLs are inserted as preview cards instead of favicon + title links.",
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.renderAsCard)
					.onChange(async (value) => {
						this.plugin.settings.renderAsCard = value;
						await this.plugin.persistSettings();
					});
			});

		new Setting(containerEl)
			.setName("Show favicon")
			.setDesc("Turn off to insert plain title links, without the site icon.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showFavicon)
					.onChange(async (value) => {
						this.plugin.settings.showFavicon = value;
						await this.plugin.persistSettings();
					});
			});

		this.addFaviconSlider(
			containerEl,
			"Favicon size",
			"Width and height of the favicon in pixels. Also applies to existing links.",
			FAVICON_SIZE_RANGE,
			"faviconSize",
		);

		this.addFaviconSlider(
			containerEl,
			"Favicon spacing",
			"Extra space between the favicon and the title, in pixels.",
			FAVICON_SPACING_RANGE,
			"faviconSpacing",
		);

		this.addFaviconSlider(
			containerEl,
			"Favicon vertical offset",
			"Move the favicon up (positive) or down (negative) to line it up with your theme's text.",
			FAVICON_OFFSET_RANGE,
			"faviconOffset",
		);

		new Setting(containerEl)
			.setName("Ignored domains")
			.setDesc(
				"One domain per line. Matches the exact domain and its subdomains.",
			)
			.addTextArea((textArea) => {
				textArea
					.setPlaceholder("example.com")
					.setValue(this.plugin.settings.ignoredDomainsRaw)
					.onChange((value) => {
						this.plugin.settings.ignoredDomainsRaw = value;
						this.saveSoon();
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
					.onChange((value) => {
						this.plugin.settings.ignoredUrlsRaw = value;
						this.saveSoon();
					});

				textArea.inputEl.rows = 8;
				textArea.inputEl.cols = 40;
			});
	}

	private addFaviconSlider(
		containerEl: HTMLElement,
		name: string,
		description: string,
		range: NumberRange,
		key: FaviconNumberSetting,
	): void {
		new Setting(containerEl)
			.setName(name)
			.setDesc(description)
			.addSlider((slider) => {
				slider
					.setLimits(range.min, range.max, range.step)
					.setValue(this.plugin.settings[key])
					.setDynamicTooltip()
					.onChange((value) => {
						this.plugin.settings[key] = value;
						// Preview right away; the write to disk is debounced.
						applyFaviconStyles(this.plugin.settings);
						this.saveSoon();
					});
			})
			.addExtraButton((button) => {
				button
					.setIcon("rotate-ccw")
					.setTooltip("Restore default")
					.onClick(async () => {
						this.plugin.settings[key] = DEFAULT_SETTINGS[key];
						await this.plugin.persistSettings();
						this.display();
					});
			});
	}
}
