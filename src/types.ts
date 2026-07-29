import type { GoogleAccount } from "./google/types";

export interface CardDavProfile {
	id: string;
	name: string;
	serverUrl: string;
	username: string;
	password: string;
	addressBookUrl: string | null;
	/**
	 * Set only for a Google-connected profile (OAuth device flow, see
	 * google/deviceAuth.ts). Google's device authorization grant hard-rejects
	 * the `carddav` scope, so this profile doesn't speak CardDAV at all - its
	 * contacts come from the People API instead (see google/peopleClient.ts).
	 * serverUrl/username/password/addressBookUrl are unused.
	 */
	google: GoogleAccount | null;
}

export interface Contact {
	uid: string;
	profileName: string;
	fullName: string;
	email: string | null;
	phone: string | null;
	org: string | null;
	url: string;
	etag: string | null;
}

export interface HarangContactsSettings {
	profiles: CardDavProfile[];
	cacheTtlMinutes: number;
}
