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
	/** Stable profile id -- what {{hrcard:...}} references embed, so renaming a profile never
	 * breaks an existing note reference. See profileName below for the display-only counterpart. */
	profileId: string;
	/** Snapshot of the owning profile's display name as of this contact's last fetch -- shown on
	 * the contact card as "source: X", refreshed naturally on the next refreshAll(). Never used
	 * for identity/lookup (that's profileId); a rename between refreshes just shows briefly stale
	 * text here, it never breaks anything. */
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
