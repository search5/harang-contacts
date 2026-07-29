import { Plugin } from "obsidian";
import { HarangContactsSettings } from "./types";
import { DEFAULT_SETTINGS } from "./settings";
import { HarangContactsSettingTab } from "./settingsTab";
import { ContactStore } from "./carddav/store";
import { HrcardEditorSuggest } from "./editorSuggest";
import { buildContactLivePreviewPlugin } from "./render/livePreview";
import { createContactPostProcessor } from "./render/postProcessor";
import { closeContactCard } from "./render/card";
import { carddavPasswordSecretId, googleTokenSecretId } from "./secrets";
import { t } from "./i18n";

interface GoogleTokenPair {
	accessToken: string;
	refreshToken: string;
}

export default class HarangContactsPlugin extends Plugin {
	settings: HarangContactsSettings = DEFAULT_SETTINGS;
	contactStore: ContactStore = new ContactStore(() => this.settings);

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new HarangContactsSettingTab(this.app, this));
		this.registerEditorSuggest(new HrcardEditorSuggest(this.app, () => this.settings.profiles, this.contactStore));
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

		if (this.settings.profiles.some((p) => p.addressBookUrl || p.google)) {
			void this.contactStore.refreshAll();
		}
	}

	onunload(): void {
		closeContactCard();
	}

	async loadSettings(): Promise<void> {
		const stored = (await this.loadData()) as Partial<HarangContactsSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, stored);
		let needsMigrationSave = false;

		for (const profile of this.settings.profiles) {
			const secretId = carddavPasswordSecretId(profile.id);
			const savedSecret = this.app.secretStorage.getSecret(secretId);
			if (savedSecret !== null) {
				profile.password = savedSecret;
			} else if (profile.password) {
				// Pre-SecretStorage data.json still has this profile's password in plain text - move it over.
				this.app.secretStorage.setSecret(secretId, profile.password);
				needsMigrationSave = true;
			}

			if (profile.google) {
				const tokenSecretId = googleTokenSecretId(profile.id);
				const savedTokens = this.readGoogleTokens(tokenSecretId);
				if (savedTokens) {
					profile.google.accessToken = savedTokens.accessToken;
					profile.google.refreshToken = savedTokens.refreshToken;
				} else if (profile.google.accessToken || profile.google.refreshToken) {
					// Pre-SecretStorage data.json still has these tokens in plain text - move them over.
					this.writeGoogleTokens(tokenSecretId, profile.google);
					needsMigrationSave = true;
				}
			}
		}

		if (needsMigrationSave) await this.saveSettings();
	}

	async saveSettings(): Promise<void> {
		for (const profile of this.settings.profiles) {
			this.app.secretStorage.setSecret(carddavPasswordSecretId(profile.id), profile.password);
			if (profile.google) this.writeGoogleTokens(googleTokenSecretId(profile.id), profile.google);
		}

		await this.saveData({
			...this.settings,
			profiles: this.settings.profiles.map((profile) => ({
				...profile,
				password: "",
				google: profile.google ? { ...profile.google, accessToken: "", refreshToken: "" } : null,
			})),
		});
	}

	private readGoogleTokens(secretId: string): GoogleTokenPair | null {
		const raw = this.app.secretStorage.getSecret(secretId);
		if (!raw) return null;
		try {
			return JSON.parse(raw) as GoogleTokenPair;
		} catch {
			return null;
		}
	}

	private writeGoogleTokens(secretId: string, tokens: GoogleTokenPair): void {
		this.app.secretStorage.setSecret(secretId, JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }));
	}
}
