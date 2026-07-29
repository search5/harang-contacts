import { Notice } from "obsidian";
import { CardDavProfile, Contact, HarangContactsSettings } from "../types";
import { CardDavClient } from "./client";
import { GooglePeopleClient } from "../google/peopleClient";
import { t } from "../i18n";

export class ContactStore {
	private contacts: Contact[] = [];
	private byUid: Map<string, Contact> = new Map();
	private lastFetchedAt = 0;

	constructor(private getSettings: () => HarangContactsSettings) {}

	getAll(): Contact[] {
		return this.contacts;
	}

	getByUid(uid: string, profileName?: string): Contact | undefined {
		if (profileName) {
			return this.byUid.get(`${profileName}:${uid}`);
		}
		return this.contacts.find((c) => c.uid === uid);
	}

	/** Case-insensitive search for contacts whose name includes query, optionally scoped to one profile. */
	search(query: string, limit = Infinity, profileName?: string): Contact[] {
		const q = query.trim().toLowerCase();
		const scoped = profileName ? this.contacts.filter((c) => c.profileName === profileName) : this.contacts;
		const source = q.length === 0 ? scoped : scoped.filter((c) => c.fullName.toLowerCase().includes(q));
		return source.slice(0, limit);
	}

	isStale(): boolean {
		const ttlMs = this.getSettings().cacheTtlMinutes * 60 * 1000;
		return Date.now() - this.lastFetchedAt > ttlMs;
	}

	async refreshIfStale(): Promise<void> {
		if (this.contacts.length === 0 || this.isStale()) {
			await this.refreshAll();
		}
	}

	async refreshAll(): Promise<void> {
		const profiles = this.getSettings().profiles;
		const results = await Promise.allSettled(profiles.map((p) => this.refreshProfile(p)));

		const merged: Contact[] = [];
		const failures: string[] = [];
		results.forEach((result, i) => {
			if (result.status === "fulfilled") {
				merged.push(...result.value);
			} else {
				const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
				failures.push(`${profiles[i].name}: ${reason}`);
			}
		});

		this.contacts = merged.sort((a, b) => a.fullName.localeCompare(b.fullName));
		this.byUid = new Map(this.contacts.map((c) => [`${c.profileName}:${c.uid}`, c]));
		this.lastFetchedAt = Date.now();

		if (failures.length > 0) {
			// Also log to the console - the Notice toast disappears too quickly to read/copy a multi-line failure list.
			console.error("Harang contacts: address book refresh failures\n" + failures.join("\n"));
			new Notice(t("storeRefreshFailedNotice", { failures: failures.join("\n") }));
		}
	}

	private async refreshProfile(profile: CardDavProfile): Promise<Contact[]> {
		if (profile.google) {
			const client = new GooglePeopleClient(profile.google, (refreshed) => {
				profile.google = refreshed;
			});
			return await client.fetchContacts(profile.name);
		}
		if (!profile.addressBookUrl) return [];
		const client = new CardDavClient(profile);
		return await client.fetchContacts(profile.addressBookUrl);
	}
}
