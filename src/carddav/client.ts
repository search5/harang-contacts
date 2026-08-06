import { requestUrl } from "obsidian";
import { CardDavProfile, Contact } from "../types";
import { parseVCard } from "./vcard";
import { t } from "../i18n";

const DAV_NS = "DAV:";
const CARDDAV_NS = "urn:ietf:params:xml:ns:carddav";

export class CardDavError extends Error {}

export interface DiscoveredAddressBook {
	url: string;
	displayName: string;
}

function utf8ToBase64(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary);
}

function basicAuthHeader(username: string, password: string): string {
	return "Basic " + utf8ToBase64(`${username}:${password}`);
}

function resolveUrl(base: string, href: string): string {
	return new URL(href, base).toString();
}

export class CardDavClient {
	constructor(private profile: CardDavProfile) {}

	private async dav(url: string, method: string, depth: string, body: string): Promise<{ status: number; text: string; url: string }> {
		const res = await requestUrl({
			url,
			method,
			headers: {
				Authorization: basicAuthHeader(this.profile.username, this.profile.password),
				"Content-Type": "application/xml; charset=utf-8",
				Depth: depth,
			},
			body,
			throw: false,
		});
		if (res.status >= 400) {
			const bodySnippet = res.text ? `: ${res.text.slice(0, 500)}` : "";
			throw new CardDavError(t("davRequestFailed", { method, url, status: res.status }) + bodySnippet);
		}
		return { status: res.status, text: res.text, url };
	}

	private parseMultistatus(xmlText: string): Document {
		const parser = new DOMParser();
		const doc = parser.parseFromString(xmlText, "application/xml");
		const parserError = doc.getElementsByTagName("parsererror")[0];
		if (parserError) {
			throw new CardDavError(t("davParseError"));
		}
		return doc;
	}

	private firstText(el: Element, ns: string, tag: string): string | null {
		const found = el.getElementsByTagNameNS(ns, tag)[0];
		return found?.textContent?.trim() ?? null;
	}

	private hasResourceType(el: Element, ns: string, tag: string): boolean {
		const resType = el.getElementsByTagNameNS(DAV_NS, "resourcetype")[0];
		if (!resType) return false;
		return resType.getElementsByTagNameNS(ns, tag).length > 0;
	}

	/** Attempts to resolve the CardDAV address book collection URL for this profile. */
	async discoverAddressBooks(): Promise<DiscoveredAddressBook[]> {
		const base = this.profile.serverUrl.trim();
		if (!base) throw new CardDavError(t("davEmptyServerUrl"));

		// 1) Check whether the given URL is already an address book collection
		try {
			const selfCheck = await this.dav(
				base,
				"PROPFIND",
				"0",
				`<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/><D:displayname/></D:prop></D:propfind>`
			);
			const doc = this.parseMultistatus(selfCheck.text);
			const response = doc.getElementsByTagNameNS(DAV_NS, "response")[0];
			if (response && this.hasResourceType(response, CARDDAV_NS, "addressbook")) {
				const href = response.getElementsByTagNameNS(DAV_NS, "href")[0]?.textContent?.trim();
				const displayName = this.firstText(response, DAV_NS, "displayname") || this.profile.name;
				return [{ url: href ? resolveUrl(selfCheck.url, href) : base, displayName }];
			}
		} catch {
			// Ignore and fall through to discovery
		}

		// 2) Walk principal -> addressbook-home-set -> address book collections
		const principalUrl = await this.findCurrentUserPrincipal(base);
		const homeSetUrl = await this.findAddressBookHomeSet(principalUrl);
		return await this.listAddressBooks(homeSetUrl);
	}

	private async findCurrentUserPrincipal(base: string): Promise<string> {
		const candidates = [base];
		try {
			const origin = new URL(base).origin;
			candidates.push(`${origin}/.well-known/carddav`);
		} catch {
			// Ignore if base isn't an absolute URL
		}

		let lastError: unknown;
		for (const candidate of candidates) {
			try {
				const res = await this.dav(
					candidate,
					"PROPFIND",
					"0",
					`<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>`
				);
				const doc = this.parseMultistatus(res.text);
				const href = doc.getElementsByTagNameNS(DAV_NS, "current-user-principal")[0]
					?.getElementsByTagNameNS(DAV_NS, "href")[0]?.textContent?.trim();
				if (href) return resolveUrl(res.url, href);
			} catch (e) {
				lastError = e;
			}
		}
		const detail = lastError instanceof Error ? `: ${lastError.message}` : "";
		throw new CardDavError(t("davPrincipalNotFound") + detail);
	}

	private async findAddressBookHomeSet(principalUrl: string): Promise<string> {
		const res = await this.dav(
			principalUrl,
			"PROPFIND",
			"0",
			`<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
<D:prop><C:addressbook-home-set/></D:prop></D:propfind>`
		);
		const doc = this.parseMultistatus(res.text);
		const href = doc.getElementsByTagNameNS(CARDDAV_NS, "addressbook-home-set")[0]
			?.getElementsByTagNameNS(DAV_NS, "href")[0]?.textContent?.trim();
		if (!href) throw new CardDavError(t("davHomeSetNotFound"));
		return resolveUrl(res.url, href);
	}

	private async listAddressBooks(homeSetUrl: string): Promise<DiscoveredAddressBook[]> {
		const res = await this.dav(
			homeSetUrl,
			"PROPFIND",
			"1",
			`<?xml version="1.0" encoding="utf-8"?>
<D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/><D:displayname/></D:prop></D:propfind>`
		);
		const doc = this.parseMultistatus(res.text);
		const responses = Array.from(doc.getElementsByTagNameNS(DAV_NS, "response"));
		const books: DiscoveredAddressBook[] = [];
		for (const response of responses) {
			if (!this.hasResourceType(response, CARDDAV_NS, "addressbook")) continue;
			const href = response.getElementsByTagNameNS(DAV_NS, "href")[0]?.textContent?.trim();
			if (!href) continue;
			const displayName = this.firstText(response, DAV_NS, "displayname") || href;
			books.push({ url: resolveUrl(res.url, href), displayName });
		}
		if (books.length === 0) throw new CardDavError(t("davNoAddressBooks"));
		return books;
	}

	/** Fetches every contact in an address book collection via REPORT (addressbook-query). */
	async fetchContacts(addressBookUrl: string): Promise<Contact[]> {
		const res = await this.dav(
			addressBookUrl,
			"REPORT",
			"1",
			`<?xml version="1.0" encoding="utf-8"?>
<C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
<D:prop><D:getetag/><C:address-data/></D:prop>
<C:filter test="allof"/>
</C:addressbook-query>`
		);
		const doc = this.parseMultistatus(res.text);
		const responses = Array.from(doc.getElementsByTagNameNS(DAV_NS, "response"));
		const contacts: Contact[] = [];
		for (const response of responses) {
			const href = response.getElementsByTagNameNS(DAV_NS, "href")[0]?.textContent?.trim();
			const vcardText = this.firstText(response, CARDDAV_NS, "address-data");
			const etag = this.firstText(response, DAV_NS, "getetag");
			if (!href || !vcardText) continue;
			const contact = parseVCard(vcardText, this.profile.id, this.profile.name, resolveUrl(res.url, href), etag);
			if (contact) contacts.push(contact);
		}
		return contacts;
	}
}
