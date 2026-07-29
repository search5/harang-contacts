/**
 * CardDAV profile passwords are kept out of data.json (which syncs in plain
 * text via whatever the vault's sync method is) and stored instead through
 * Obsidian's SecretStorage (app.secretStorage, since 1.11.4). See
 * main.ts's loadSettings/saveSettings for where this is read/written.
 */
export function carddavPasswordSecretId(profileId: string): string {
	return `harang-contacts-carddav-${profileId}`;
}

/** Holds a Google account's accessToken/refreshToken as one JSON blob - see main.ts. */
export function googleTokenSecretId(profileId: string): string {
	return `harang-contacts-google-${profileId}`;
}
