import { Plugin } from "obsidian";
import { HarangContactsSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings";
import { HarangContactsSettingTab } from "./settingsTab";
import { ContactStore } from "./carddav/store";
import { ContactEditorSuggest } from "./editorSuggest";
import { buildContactLivePreviewPlugin } from "./render/livePreview";
import { createContactPostProcessor } from "./render/postProcessor";
import { closeContactCard } from "./render/card";
import { t } from "./i18n";

export default class HarangContactsPlugin extends Plugin {
	settings: HarangContactsSettings = DEFAULT_SETTINGS;
	contactStore: ContactStore = new ContactStore(() => this.settings);

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new HarangContactsSettingTab(this.app, this));
		this.registerEditorSuggest(new ContactEditorSuggest(this.app, this.contactStore));
		this.registerEditorExtension(buildContactLivePreviewPlugin(this.contactStore));
		this.registerMarkdownPostProcessor(createContactPostProcessor(this.contactStore));

		this.addCommand({
			id: "refresh-contacts",
			name: t("commandRefreshContacts"),
			callback: async () => {
				await this.contactStore.refreshAll();
			},
		});

		this.registerDomEvent(document, "keydown", (evt: KeyboardEvent) => {
			if (evt.key === "Escape") closeContactCard();
		});

		if (this.settings.profiles.some((p) => p.addressBookUrl)) {
			void this.contactStore.refreshAll();
		}
	}

	onunload(): void {
		closeContactCard();
	}

	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as Partial<HarangContactsSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, stored);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
