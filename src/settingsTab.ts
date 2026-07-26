import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	SettingDefinitionItem,
	SettingDefinitionPage,
} from "obsidian";
import type HarangContactsPlugin from "./main";
import { createEmptyProfile } from "./settings";
import { CardDavClient, CardDavError } from "./carddav/client";
import { CardDavProfile } from "./types";
import { t } from "./i18n";

const SERVER_URL_PLACEHOLDER = "https://example.com/dav.php/addressbooks/user/contacts/";
const PROFILE_KEY_PREFIX = "profile:";
type ProfileTextField = "name" | "serverUrl" | "username";

function parseProfileKey(key: string): { profileId: string; field: ProfileTextField } | null {
	const match = key.match(/^profile:([^:]+):(name|serverUrl|username)$/);
	if (!match) return null;
	return { profileId: match[1], field: match[2] as ProfileTextField };
}

export class HarangContactsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: HarangContactsPlugin) {
		super(app, plugin);
	}

	// ---- Obsidian 1.13.0+: declarative settings API ----

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: t("settingsCacheTtlName"),
				desc: t("settingsCacheTtlDesc"),
				control: {
					type: "number",
					key: "cacheTtlMinutes",
					min: 1,
					step: 1,
					validate: (value) => (Number.isFinite(value) && value > 0 ? undefined : t("settingsCacheTtlValidation")),
				},
			},
			{
				name: t("settingsRefreshAllName"),
				render: (setting) => {
					setting.addButton((btn) =>
						btn.setButtonText(t("settingsRefreshButtonIdle")).onClick(async () => {
							btn.setDisabled(true).setButtonText(t("settingsRefreshButtonLoading"));
							await this.plugin.contactStore.refreshAll();
							btn.setDisabled(false).setButtonText(t("settingsRefreshButtonIdle"));
							new Notice(t("settingsRefreshNotice"));
						})
					);
				},
			},
			{
				type: "list",
				heading: t("settingsProfilesHeading"),
				emptyState: t("settingsProfilesEmptyState"),
				items: this.plugin.settings.profiles.map((profile) => this.buildProfilePage(profile)),
				onDelete: (index) => {
					this.plugin.settings.profiles.splice(index, 1);
					void this.plugin.saveSettings();
					this.update();
				},
				addItem: {
					name: t("settingsAddProfileName"),
					action: () => {
						this.plugin.settings.profiles.push(createEmptyProfile());
						void this.plugin.saveSettings();
						this.update();
					},
				},
			},
		];
	}

	getControlValue(key: string): unknown {
		const profileField = parseProfileKey(key);
		if (profileField) {
			const profile = this.plugin.settings.profiles.find((p) => p.id === profileField.profileId);
			return profile ? profile[profileField.field] : undefined;
		}
		if (key === "cacheTtlMinutes") return this.plugin.settings.cacheTtlMinutes;
		return undefined;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		const profileField = parseProfileKey(key);
		if (profileField && typeof value === "string") {
			const profile = this.plugin.settings.profiles.find((p) => p.id === profileField.profileId);
			if (!profile) return;
			profile[profileField.field] = value;
			await this.plugin.saveSettings();
			return;
		}
		if (key === "cacheTtlMinutes" && typeof value === "number") {
			this.plugin.settings.cacheTtlMinutes = value;
			await this.plugin.saveSettings();
		}
	}

	private buildProfilePage(profile: CardDavProfile): SettingDefinitionPage {
		return {
			type: "page",
			name: profile.name || t("settingsUnnamedProfile"),
			displayValue: () => (profile.addressBookUrl ? t("settingsProfileConnected") : t("settingsProfileNotConnected")),
			status: () => (profile.addressBookUrl ? null : "warning"),
			items: [
				{
					name: t("settingsProfileNameLabel"),
					control: { type: "text", key: `${PROFILE_KEY_PREFIX}${profile.id}:name` },
				},
				{
					name: t("settingsServerUrlLabel"),
					desc: t("settingsServerUrlDesc"),
					control: {
						type: "text",
						key: `${PROFILE_KEY_PREFIX}${profile.id}:serverUrl`,
						placeholder: SERVER_URL_PLACEHOLDER,
					},
				},
				{
					name: t("settingsUsernameLabel"),
					control: { type: "text", key: `${PROFILE_KEY_PREFIX}${profile.id}:username` },
				},
				{
					name: t("settingsPasswordLabel"),
					render: (setting) => {
						setting.addText((text) => {
							text.inputEl.type = "password";
							text.setValue(profile.password).onChange(async (value) => {
								profile.password = value;
								await this.plugin.saveSettings();
							});
						});
					},
				},
				{
					name: t("settingsAddressBookUrlLabel"),
					desc: profile.addressBookUrl || t("settingsAddressBookUrlPending"),
					render: (setting) => {
						setting.addButton((btn) =>
							btn.setButtonText(t("settingsTestConnectionIdle")).onClick(async () => {
								btn.setDisabled(true).setButtonText(t("settingsTestConnectionLoading"));
								try {
									await this.testConnection(profile);
									this.update();
								} finally {
									btn.setDisabled(false).setButtonText(t("settingsTestConnectionIdle"));
								}
							})
						);
					},
				},
			],
		};
	}

	// ---- Imperative fallback for Obsidian < 1.13.0 ----
	// This method is not called on Obsidian 1.13.0+ once getSettingDefinitions()
	// returns a non-empty array. It's kept only to support older versions.
	// This file intentionally references APIs newer than its minAppVersion
	// (1.8.7) — update(), other 1.13.0+-only SettingTab members — and keeps
	// display() even though it's marked @deprecated. That's why the relevant
	// lint rules are disabled for this one file in eslint.config.mjs.

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName(t("settingsCacheTtlName"))
			.setDesc(t("settingsCacheTtlDesc"))
			.addText((text) =>
				text
					.setValue(String(this.plugin.settings.cacheTtlMinutes))
					.onChange(async (value) => {
						const parsed = Number(value);
						if (!Number.isFinite(parsed) || parsed <= 0) return;
						this.plugin.settings.cacheTtlMinutes = parsed;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName(t("settingsRefreshAllName"))
			.addButton((btn) =>
				btn.setButtonText(t("settingsRefreshButtonIdle")).onClick(async () => {
					btn.setDisabled(true).setButtonText(t("settingsRefreshButtonLoading"));
					await this.plugin.contactStore.refreshAll();
					btn.setDisabled(false).setButtonText(t("settingsRefreshButtonIdle"));
					new Notice(t("settingsRefreshNotice"));
				})
			);

		new Setting(containerEl).setName(t("settingsProfilesHeading")).setHeading();

		for (const profile of this.plugin.settings.profiles) {
			this.renderProfile(containerEl, profile.id);
		}

		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText(t("settingsAddProfileName"))
				.setCta()
				.onClick(async () => {
					this.plugin.settings.profiles.push(createEmptyProfile());
					await this.plugin.saveSettings();
					this.display();
				})
		);
	}

	private renderProfile(containerEl: HTMLElement, profileId: string): void {
		const profile = this.plugin.settings.profiles.find((p) => p.id === profileId);
		if (!profile) return;

		const section = containerEl.createDiv({ cls: "harang-contacts-profile" });
		new Setting(section).setName(profile.name || t("settingsUnnamedProfile")).setHeading();

		new Setting(section).setName(t("settingsProfileNameLabel")).addText((text) =>
			text.setValue(profile.name).onChange(async (value) => {
				profile.name = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(section).setName(t("settingsServerUrlLabel")).setDesc(t("settingsServerUrlDesc")).addText((text) =>
			text
				.setPlaceholder(SERVER_URL_PLACEHOLDER)
				.setValue(profile.serverUrl)
				.onChange(async (value) => {
					profile.serverUrl = value;
					await this.plugin.saveSettings();
				})
		);

		new Setting(section).setName(t("settingsUsernameLabel")).addText((text) =>
			text.setValue(profile.username).onChange(async (value) => {
				profile.username = value;
				await this.plugin.saveSettings();
			})
		);

		new Setting(section).setName(t("settingsPasswordLabel")).addText((text) => {
			text.inputEl.type = "password";
			text.setValue(profile.password).onChange(async (value) => {
				profile.password = value;
				await this.plugin.saveSettings();
			});
		});

		new Setting(section)
			.setName(t("settingsAddressBookUrlLabel"))
			.setDesc(profile.addressBookUrl || t("settingsAddressBookUrlPending"))
			.addButton((btn) =>
				btn.setButtonText(t("settingsTestConnectionIdle")).onClick(async () => {
					btn.setDisabled(true).setButtonText(t("settingsTestConnectionLoading"));
					try {
						await this.testConnection(profile);
						this.display();
					} finally {
						btn.setDisabled(false).setButtonText(t("settingsTestConnectionIdle"));
					}
				})
			);

		new Setting(section).addButton((btn) =>
			btn
				.setButtonText(t("settingsDeleteProfileButton"))
				.setWarning()
				.onClick(async () => {
					this.plugin.settings.profiles = this.plugin.settings.profiles.filter((p) => p.id !== profileId);
					await this.plugin.saveSettings();
					this.display();
				})
		);
	}

	// ---- Shared ----

	private async testConnection(profile: CardDavProfile): Promise<void> {
		try {
			const client = new CardDavClient(profile);
			const books = await client.discoverAddressBooks();
			profile.addressBookUrl = books[0].url;
			await this.plugin.saveSettings();
			new Notice(t("settingsDiscoverySuccessNotice", { count: books.length, name: books[0].displayName }));
			await this.plugin.contactStore.refreshAll();
		} catch (e) {
			const message = e instanceof CardDavError ? e.message : String(e);
			new Notice(t("settingsDiscoveryFailNotice", { message }));
		}
	}
}
