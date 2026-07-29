# harang-contacts

🌐 **English** | [한국어](README.ko.md)

📖 **[Documentation](https://search5.github.io/harang-contacts/)** (English / 한국어)

An [Obsidian](https://obsidian.md) plugin that lets you reference contacts from a [CardDAV](https://www.rfc-editor.org/rfc/rfc6352) address book directly from your notes. Type a dedicated inline syntax, pick a contact from your CardDAV server, and it's rendered as a compact chip right in the note. The plugin is **read-only** — it never creates, edits, or deletes anything on your CardDAV server.

## Features

- **`{{hrcard:` staged autocomplete** — type `{{hrcard:` and pick a server profile, then a contact name, from one staged popup (the same pattern as the sibling `harang-calendar` plugin's `{{hrcal:` trigger). Inserts `{{hrcard:<profileName>:<uid>}}`.
- **Inline chips, in both Live Preview and Reading view** — a reference renders as a rounded pill showing the contact's name (and email, if they have one), not raw syntax.
- **Click-to-open detail card** — click a chip to see email, phone, and organization; click outside or press Esc to close.
- **Unambiguous even with duplicate names** — a picked reference is pinned to the exact contact (server profile + CardDAV UID), so two people sharing a name never get confused with each other.
- **Multiple CardDAV servers** — configure any number of server profiles; contacts from all of them are merged and searched together.
- **Standard CardDAV discovery** — point a profile at a server root or a specific address book URL; the plugin walks `current-user-principal` → `addressbook-home-set` → address book collection automatically.
- **Follows Obsidian's UI language** — settings, notices, and card labels are shown in Korean or English depending on your Obsidian language setting (via the official `getLanguage()` API).

## Prerequisites

- A CardDAV-compatible address book reachable over HTTP(S) — e.g. [Radicale](https://radicale.org/), Nextcloud Contacts, Fastmail, or any [RFC 6352](https://www.rfc-editor.org/rfc/rfc6352) server.
- Obsidian 1.12.7 or later.

See the [Prerequisites](https://search5.github.io/harang-contacts/en/prerequisites.html) page for details.

## Installation

Open **Settings → Community plugins → Browse** in Obsidian, search for **"Harang Contacts"**, then click **Install** and **Enable**.

A manual install from pre-built files is also possible if you'd rather not use the Community Plugins browser — see the [Installation](https://search5.github.io/harang-contacts/en/installation.html) page for details.

## Usage

1. In **Settings → Harang Contacts**, add a server profile (name, server URL, username, password) and click **Test connection & auto-discover**.
2. In a note, type `{{hrcard:`, pick the profile, then pick a contact from the autocomplete popup.
3. Click the resulting chip to see the contact's full details.

See the [Usage](https://search5.github.io/harang-contacts/en/usage.html) guide for the full walkthrough, including how multiple profiles and duplicate names are handled.

## Known limitations

- References are only meant to be inserted via the `{{hrcard:` autocomplete — a hand-typed reference needs the exact CardDAV UID to resolve, which isn't practical to type from memory.
- Contacts are cached client-side with a configurable TTL (default 30 minutes); changes made on the server aren't reflected until the next refresh.

## License

BSD-3-Clause — see [LICENSE](LICENSE).
