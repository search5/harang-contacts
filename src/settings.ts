import { HarangContactsSettings } from "./types";
import { t } from "./i18n";

export const DEFAULT_SETTINGS: HarangContactsSettings = {
	profiles: [],
	cacheTtlMinutes: 30,
};

export function createEmptyProfile(): import("./types").CardDavProfile {
	return {
		id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: t("settingsNewProfileDefaultName"),
		serverUrl: "",
		username: "",
		password: "",
		addressBookUrl: null,
	};
}
