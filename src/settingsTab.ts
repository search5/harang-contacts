import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type HarangContactsPlugin from "./main";
import { createEmptyProfile } from "./settings";
import { CardDavClient, CardDavError } from "./carddav/client";
import { CardDavProfile } from "./types";
import { t } from "./i18n";

const SERVER_URL_PLACEHOLDER = "https://example.com/dav.php/addressbooks/user/contacts/";

export class HarangContactsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: HarangContactsPlugin) {
		super(app, plugin);
	}

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
