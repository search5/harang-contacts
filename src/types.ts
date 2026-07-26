export interface CardDavProfile {
	id: string;
	name: string;
	serverUrl: string;
	username: string;
	password: string;
	addressBookUrl: string | null;
}

export interface Contact {
	uid: string;
	profileId: string;
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
