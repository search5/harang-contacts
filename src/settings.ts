import { CardDavProfile, HarangContactsSettings } from "./types";
import type { GoogleAccount } from "./google/types";
import { t } from "./i18n";

export const DEFAULT_SETTINGS: HarangContactsSettings = {
	profiles: [],
	cacheTtlMinutes: 30,
};

export function createEmptyProfile(): CardDavProfile {
	return {
		id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: t("settingsNewProfileDefaultName"),
		serverUrl: "",
		username: "",
		password: "",
		addressBookUrl: null,
		google: null,
	};
}

export function createGoogleProfile(google: GoogleAccount): CardDavProfile {
	return {
		id: `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		name: t("settingsNewGoogleProfileDefaultName"),
		serverUrl: "",
		username: "",
		password: "",
		addressBookUrl: null,
		google,
	};
}
