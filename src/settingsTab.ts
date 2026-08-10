import { App, Notice, PluginSettingTab, SettingDefinitionItem } from "obsidian";
import type HarangContactsPlugin from "./main";
import { createEmptyProfile, createGoogleProfile } from "./settings";
import { CardDavClient, CardDavError } from "./carddav/client";
import { CardDavProfile } from "./types";
import { DeviceCodeModal } from "./google/DeviceCodeModal";
import { carddavPasswordSecretId, googleTokenSecretId } from "./secrets";
import { GOOGLE_INTEGRATION_ENABLED } from "./featureFlags";
import { t } from "./i18n";
import { shouldStopTabPropagation } from "./settingsTabKeyboard";

const SERVER_URL_PLACEHOLDER = "https://example.com/dav.php/addressbooks/user/contacts/";

export class HarangContactsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: HarangContactsPlugin) {
		super(app, plugin);

		// Restores native Tab-to-next-field navigation inside this settings tab -- see
		// settingsTabKeyboard.ts for why this is needed (Obsidian's own core Settings modal
		// otherwise intercepts Tab on an ancestor container and repurposes it as row-jump
		// navigation). Bubble-phase listener on our own containerEl fires before Obsidian's
		// listener on the shared ancestor container, so stopping propagation here keeps the
		// event from ever reaching it -- preventDefault() is deliberately never called, so the
		// browser's native focus-move behavior still applies.
		this.containerEl.addEventListener("keydown", (evt) => {
			if (shouldStopTabPropagation(evt.key)) {
				evt.stopPropagation();
			}
		});
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: t("settingsCacheTtlName"),
				desc: t("settingsCacheTtlDesc"),
				render: (setting) => {
					setting.addText((text) =>
						text
							.setValue(String(this.plugin.settings.cacheTtlMinutes))
							.onChange(async (value) => {
								const parsed = Number(value);
								if (!Number.isFinite(parsed) || parsed <= 0) return;
								this.plugin.settings.cacheTtlMinutes = parsed;
								await this.plugin.saveSettings();
							})
					);
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
				name: t("settingsProfilesHeading"),
				render: (setting) => {
					setting.setHeading();
				},
			},
			...this.plugin.settings.profiles.map((profile) => this.profileDefinition(profile)),
			this.addProfileDefinition(),
		];
	}

	private profileDefinition(profile: CardDavProfile): SettingDefinitionItem {
		if (profile.google) {
			return {
				type: "group",
				cls: "harang-contacts-profile",
				items: [
					{
						name: t("settingsProfileNameLabel"),
						desc: t("googleConnectedAs", { email: profile.google.email ?? "" }),
						render: (setting) => {
							setting
								.addText((text) =>
									text.setValue(profile.name).onChange(async (value) => {
										profile.name = value;
										await this.plugin.saveSettings();
									})
								)
								.addButton((btn) =>
									btn
										.setButtonText(t("googleDisconnectButton"))
										.setDestructive()
										.onClick(async () => {
											this.plugin.settings.profiles = this.plugin.settings.profiles.filter((p) => p.id !== profile.id);
											this.app.secretStorage.setSecret(carddavPasswordSecretId(profile.id), "");
											this.app.secretStorage.setSecret(googleTokenSecretId(profile.id), "");
											await this.plugin.saveSettings();
											this.update();
										})
								);
						},
					},
				],
			};
		}

		return {
			type: "group",
			heading: profile.name || t("settingsUnnamedProfile"),
			cls: "harang-contacts-profile",
			items: [
				{
					name: t("settingsProfileNameLabel"),
					render: (setting) => {
						setting.addText((text) =>
							text.setValue(profile.name).onChange(async (value) => {
								profile.name = value;
								await this.plugin.saveSettings();
							})
						);
					},
				},
				{
					name: t("settingsServerUrlLabel"),
					desc: t("settingsServerUrlDesc"),
					render: (setting) => {
						setting.addText((text) =>
							text
								.setPlaceholder(SERVER_URL_PLACEHOLDER)
								.setValue(profile.serverUrl)
								.onChange(async (value) => {
									profile.serverUrl = value;
									await this.plugin.saveSettings();
								})
						);
					},
				},
				{
					name: t("settingsUsernameLabel"),
					render: (setting) => {
						setting.addText((text) =>
							text.setValue(profile.username).onChange(async (value) => {
								profile.username = value;
								await this.plugin.saveSettings();
							})
						);
					},
				},
				{
					name: t("settingsPasswordLabel"),
					desc: t("settingsPasswordDesc"),
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
				{
					name: "",
					render: (setting) => {
						setting.addButton((btn) =>
							btn
								.setButtonText(t("settingsDeleteProfileButton"))
								.setDestructive()
								.onClick(async () => {
									this.plugin.settings.profiles = this.plugin.settings.profiles.filter((p) => p.id !== profile.id);
									this.app.secretStorage.setSecret(carddavPasswordSecretId(profile.id), "");
									await this.plugin.saveSettings();
									this.update();
								})
						);
					},
				},
			],
		};
	}

	private addProfileDefinition(): SettingDefinitionItem {
		return {
			name: "",
			desc: t("settingsAddProfileDesc"),
			render: (setting) => {
				setting.addButton((btn) =>
					btn.setButtonText(t("settingsAddCarddavProfileButton")).onClick(async () => {
						this.plugin.settings.profiles.push(createEmptyProfile());
						await this.plugin.saveSettings();
						this.update();
					})
				);

				if (GOOGLE_INTEGRATION_ENABLED) {
					setting.addButton((btn) =>
						btn
							.setButtonText(t("settingsAddGoogleProfileButton"))
							.setCta()
							.onClick(() => {
								new DeviceCodeModal(this.app, async (connected) => {
									const profile = createGoogleProfile(connected);
									this.plugin.settings.profiles.push(profile);
									await this.plugin.saveSettings();
									await this.plugin.contactStore.refreshAll();
									this.update();
								}).open();
							})
					);
				}
			},
		};
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
