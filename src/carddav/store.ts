import { Notice } from "obsidian";
import { CardDavProfile, Contact, HarangContactsSettings } from "../types";
import { CardDavClient } from "./client";
import { t } from "../i18n";

export class ContactStore {
	private contacts: Contact[] = [];
	private byUid: Map<string, Contact> = new Map();
	private lastFetchedAt = 0;

	constructor(private getSettings: () => HarangContactsSettings) {}

	getAll(): Contact[] {
		return this.contacts;
	}

	getByUid(uid: string, profileId?: string): Contact | undefined {
		if (profileId) {
			return this.byUid.get(`${profileId}:${uid}`);
		}
		return this.contacts.find((c) => c.uid === uid);
	}

	/** Case-insensitive search for contacts whose name includes query. */
	search(query: string, limit = Infinity): Contact[] {
		const q = query.trim().toLowerCase();
		const source = q.length === 0 ? this.contacts : this.contacts.filter((c) => c.fullName.toLowerCase().includes(q));
		return source.slice(0, limit);
	}

	/** Finds a contact with an exactly matching name (used for rendering). Returns the first match if the name is ambiguous. */
	findByExactName(name: string): Contact | undefined {
		return this.contacts.find((c) => c.fullName === name);
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
		this.byUid = new Map(this.contacts.map((c) => [`${c.profileId}:${c.uid}`, c]));
		this.lastFetchedAt = Date.now();

		if (failures.length > 0) {
			new Notice(t("storeRefreshFailedNotice", { failures: failures.join("\n") }));
		}
	}

	private async refreshProfile(profile: CardDavProfile): Promise<Contact[]> {
		if (!profile.addressBookUrl) return [];
		const client = new CardDavClient(profile);
		return await client.fetchContacts(profile.addressBookUrl);
	}
}
