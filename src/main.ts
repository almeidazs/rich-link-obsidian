import {
	type Editor,
	type EditorPosition,
	MarkdownView,
	type Menu,
	Plugin,
} from "obsidian";
import {
	loadPluginSettings,
	type RichLinkResolverSettings,
	RichLinkResolverSettingTab,
	savePluginSettings,
} from "./settings";
import { buildIgnoreRules, shouldIgnoreUrl } from "./shared/ignore-rules";
import { buildLoadingMarkdownLink } from "./shared/loading-placeholder";
import { buildRichMarkdownLink } from "./shared/markdown-link";
import {
	showCursorUrlNotice,
	showInvalidSelectionNotice,
} from "./shared/notice";
import {
	type EditorUrlMatch,
	findUrlToResolve,
	normalizeClipboardUrl,
} from "./shared/url-detection";
import { resolveUrlMetadata } from "./shared/url-resolution";

export default class RichLinkResolverPlugin extends Plugin {
	settings!: RichLinkResolverSettings;

	override async onload(): Promise<void> {
		this.settings = await loadPluginSettings(this);
		this.addSettingTab(new RichLinkResolverSettingTab(this.app, this));

		this.addCommand({
			id: "resolve-selected-url-to-rich-link",
			name: "Resolve selected URL to rich link",
			editorCallback: async (editor) => {
				await this.resolveUrlInEditor(editor);
			},
		});

		this.registerEvent(
			this.app.workspace.on("editor-paste", (event, editor) => {
				void this.handleEditorPaste(event, editor);
			}),
		);

		this.registerEvent(
			this.app.workspace.on("editor-menu", (menu, editor) => {
				this.maybeAddEditorMenuItem(menu, editor);
			}),
		);

		this.registerEvent(
			this.app.workspace.on("url-menu", (menu, url) => {
				this.maybeAddUrlMenuItem(menu, url);
			}),
		);
	}

	private async handleEditorPaste(
		event: ClipboardEvent,
		editor: Editor,
	): Promise<void> {
		const pastedUrl = normalizeClipboardUrl(
			event.clipboardData?.getData("text/plain"),
		);

		if (!pastedUrl) {
			return;
		}

		if (shouldIgnoreUrl(pastedUrl, buildIgnoreRules(this.settings))) {
			return;
		}

		event.preventDefault();
		await this.replaceEditorTarget(editor, {
			url: pastedUrl,
			from: editor.getCursor("from"),
			to: editor.getCursor("to"),
		});
	}

	private maybeAddEditorMenuItem(menu: Menu, editor: Editor): void {
		if (!findUrlToResolve(editor)) {
			return;
		}

		menu.addItem((item) => {
			item
				.setTitle("Resolve URL to rich link")
				.setIcon("globe")
				.onClick(async () => {
					await this.resolveUrlInEditor(editor);
				});
		});
	}

	private maybeAddUrlMenuItem(menu: Menu, url: string): void {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = activeView?.editor;

		if (!editor || !findUrlToResolve(editor, url)) {
			return;
		}

		menu.addItem((item) => {
			item
				.setTitle("Resolve URL in active editor")
				.setIcon("globe")
				.onClick(async () => {
					await this.resolveUrlFromUrlMenu(url);
				});
		});
	}

	private async resolveUrlFromUrlMenu(url: string): Promise<void> {
		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		const editor = activeView?.editor;

		if (!editor) {
			showCursorUrlNotice();
			return;
		}

		await this.resolveUrlInEditor(editor, url);
	}

	private async resolveUrlInEditor(
		editor: Editor,
		preferredUrl?: string,
	): Promise<void> {
		const target = findUrlToResolve(editor, preferredUrl);

		if (!target) {
			if (preferredUrl) {
				showCursorUrlNotice();
				return;
			}

			showInvalidSelectionNotice();
			return;
		}

		await this.replaceEditorTarget(editor, target);
	}

	private async replaceEditorTarget(
		editor: Editor,
		target: EditorUrlMatch,
	): Promise<void> {
		const loadingMarkdown = buildLoadingMarkdownLink(target.url);
		editor.replaceRange(loadingMarkdown, target.from, target.to, "rich-link");

		const initialRange = this.findPlaceholderRange(
			editor,
			loadingMarkdown,
			target.from,
		) ?? {
			from: target.from,
			to: target.to,
		};

		const metadata = await resolveUrlMetadata(target.url);
		const richMarkdown = buildRichMarkdownLink(
			metadata,
			this.settings.iconPosition,
			this.settings.renderAsCard,
		);

		const currentRange =
			this.findPlaceholderRange(editor, loadingMarkdown, initialRange.from) ??
			null;

		if (!currentRange) {
			return;
		}

		editor.replaceRange(
			richMarkdown,
			currentRange.from,
			currentRange.to,
			"rich-link",
		);
	}

	private findPlaceholderRange(
		editor: Editor,
		placeholder: string,
		preferredStart: EditorPosition,
	): { from: EditorPosition; to: EditorPosition } | null {
		const documentText = editor.getValue();
		const preferredOffset = editor.posToOffset(preferredStart);
		const placeholderLength = placeholder.length;

		let matchIndex = documentText.indexOf(placeholder, preferredOffset);
		if (matchIndex === -1) {
			matchIndex = documentText.indexOf(placeholder);
		}

		if (matchIndex === -1) {
			return null;
		}

		return {
			from: editor.offsetToPos(matchIndex),
			to: editor.offsetToPos(matchIndex + placeholderLength),
		};
	}

	async persistSettings(): Promise<void> {
		this.settings = await savePluginSettings(this, this.settings);
	}
}
