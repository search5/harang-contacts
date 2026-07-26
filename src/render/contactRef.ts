import { Contact } from "../types";
import { ContactStore } from "../carddav/store";

export interface ContactRef {
	name: string;
	profileId?: string;
	uid?: string;
}

/**
 * Syntax: `name` or `name|profileId|uid`.
 * uid is a vCard UID (e.g. urn:uuid:...) which may contain colons or pipes,
 * so only name and profileId are split on the first two `|`s — the rest is
 * taken as-is for uid.
 */
export function parseContactRef(raw: string): ContactRef {
	const match = raw.match(/^([^|]*)\|([^|]*)\|([\s\S]*)$/);
	if (match) {
		return { name: match[1], profileId: match[2], uid: match[3] };
	}
	return { name: raw };
}

export function formatContactRef(contact: Contact): string {
	return `${contact.fullName}|${contact.profileId}|${contact.uid}`;
}

/** Looks up by profileId+uid first; falls back to a name search if that's not found (e.g. the contact was deleted). */
export function resolveContactRef(store: ContactStore, ref: ContactRef): Contact | undefined {
	if (ref.profileId && ref.uid) {
		const exact = store.getByUid(ref.uid, ref.profileId);
		if (exact) return exact;
	}
	return store.findByExactName(ref.name);
}
