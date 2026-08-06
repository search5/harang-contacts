import { requestUrl } from "obsidian";
import { GoogleAccount } from "./types";
import { refreshAccessToken } from "./deviceAuth";
import { Contact } from "../types";
import { t } from "../i18n";

const API_BASE = "https://people.googleapis.com/v1";
const PERSON_FIELDS = "names,emailAddresses,phoneNumbers,organizations";
const PAGE_SIZE = 1000;

export class GooglePeopleError extends Error {}

interface PeopleApiPerson {
	resourceName?: string;
	etag?: string;
	names?: { displayName?: string }[];
	emailAddresses?: { value?: string }[];
	phoneNumbers?: { value?: string }[];
	organizations?: { name?: string }[];
}

interface ListConnectionsResponse {
	connections?: PeopleApiPerson[];
	nextPageToken?: string;
}

/**
 * Google's device authorization grant hard-rejects the `carddav` scope, so a
 * Google-connected profile can't speak actual CardDAV to Google - it reads
 * contacts via the People API instead, using the same device-flow token
 * harang-calendar's Google Calendar profiles use (see google/deviceAuth.ts).
 */
export class GooglePeopleClient {
	private account: GoogleAccount;

	constructor(
		account: GoogleAccount,
		private onTokenRefreshed: (account: GoogleAccount) => void
	) {
		this.account = account;
	}

	private async ensureFreshToken(): Promise<string> {
		if (Date.now() < this.account.expiresAt - 60_000) return this.account.accessToken;
		const refreshed = await refreshAccessToken(this.account.refreshToken);
		this.account = { ...this.account, accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt };
		this.onTokenRefreshed(this.account);
		return this.account.accessToken;
	}

	async fetchContacts(profileId: string, profileName: string): Promise<Contact[]> {
		const contacts: Contact[] = [];
		let pageToken: string | undefined;
		do {
			const token = await this.ensureFreshToken();
			const params = new URLSearchParams({ personFields: PERSON_FIELDS, pageSize: String(PAGE_SIZE) });
			if (pageToken) params.set("pageToken", pageToken);

			const res = await requestUrl({
				url: `${API_BASE}/people/me/connections?${params.toString()}`,
				headers: { Authorization: `Bearer ${token}` },
				throw: false,
			});
			if (res.status >= 400) {
				throw new GooglePeopleError(t("googleApiRequestFailed", { method: "GET", path: "/people/me/connections", status: res.status }));
			}
			const json = res.json as ListConnectionsResponse;
			for (const person of json.connections ?? []) {
				const contact = this.toContact(person, profileId, profileName);
				if (contact) contacts.push(contact);
			}
			pageToken = json.nextPageToken;
		} while (pageToken);
		return contacts;
	}

	private toContact(person: PeopleApiPerson, profileId: string, profileName: string): Contact | null {
		const resourceName = person.resourceName;
		const fullName = person.names?.[0]?.displayName;
		if (!resourceName || !fullName) return null;
		return {
			uid: resourceName,
			profileId,
			profileName,
			fullName,
			email: person.emailAddresses?.[0]?.value ?? null,
			phone: person.phoneNumbers?.[0]?.value ?? null,
			org: person.organizations?.[0]?.name ?? null,
			url: `https://contacts.google.com/person/${resourceName.replace("people/", "")}`,
			etag: person.etag ?? null,
		};
	}
}
