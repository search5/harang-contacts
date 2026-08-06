import { Contact } from "../types";

function unfold(raw: string): string {
	return raw.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "");
}

function unescapeValue(value: string): string {
	return value
		.replace(/\\n/gi, "\n")
		.replace(/\\,/g, ",")
		.replace(/\\;/g, ";")
		.replace(/\\\\/g, "\\");
}

interface VCardLine {
	name: string;
	params: Record<string, string>;
	value: string;
}

function parseLine(line: string): VCardLine | null {
	const colonIndex = line.indexOf(":");
	if (colonIndex === -1) return null;
	const head = line.slice(0, colonIndex);
	const value = line.slice(colonIndex + 1);
	const parts = head.split(";");
	const name = parts[0].toUpperCase();
	const params: Record<string, string> = {};
	for (const part of parts.slice(1)) {
		const eq = part.indexOf("=");
		if (eq === -1) continue;
		params[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1).toUpperCase();
	}
	return { name, params, value: unescapeValue(value) };
}

/** Parses a single vCard (VERSION 3/4) text blob into a Contact. Returns null if no FN/UID present. */
export function parseVCard(
	text: string,
	profileId: string,
	profileName: string,
	sourceUrl: string,
	etag: string | null
): Contact | null {
	const lines = unfold(text).split("\n").filter((l) => l.trim().length > 0);

	let fullName: string | null = null;
	let uid: string | null = null;
	let email: string | null = null;
	let emailPref = -1;
	let phone: string | null = null;
	let org: string | null = null;

	for (const raw of lines) {
		const parsed = parseLine(raw);
		if (!parsed) continue;
		const { name, params, value } = parsed;

		if (name === "FN") {
			fullName = value.trim();
		} else if (name === "UID") {
			uid = value.trim();
		} else if (name === "EMAIL") {
			const pref = params["TYPE"] === "PREF" || params["PREF"] === "1" ? 1 : 0;
			if (!email || pref > emailPref) {
				email = value.trim();
				emailPref = pref;
			}
		} else if (name === "TEL" && !phone) {
			phone = value.trim();
		} else if (name === "ORG" && !org) {
			org = value.split(";")[0].trim();
		}
	}

	if (!fullName) return null;
	if (!uid) uid = sourceUrl;

	return {
		uid,
		profileId,
		profileName,
		fullName,
		email,
		phone,
		org,
		url: sourceUrl,
		etag,
	};
}
