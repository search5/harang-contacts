# harang-contacts

🌐 **English** | [한국어](README.ko.md)

📖 **[Documentation](https://search5.github.io/harang-contacts/)** (English / 한국어)

An [Obsidian](https://obsidian.md) plugin that lets you reference contacts from a [CardDAV](https://www.rfc-editor.org/rfc/rfc6352) address book directly from your notes. Type a dedicated inline syntax, pick a contact from your CardDAV server, and it's rendered as a compact chip right in the note. The plugin is **read-only** — it never creates, edits, or deletes anything on your CardDAV server.

## Features

- **`@contact[` autocomplete** — type `@contact[` followed by a name to search the cached address book and insert a reference, the same way Obsidian's own link autocomplete works.
- **Inline chips, in both Live Preview and Reading view** — a reference renders as a rounded pill showing the contact's name (and email, if they have one), not raw syntax.
- **Click-to-open detail card** — click a chip to see email, phone, and organization; click outside or press Esc to close.
- **Unambiguous even with duplicate names** — a picked reference is pinned to the exact contact (server profile + CardDAV UID), so two people sharing a name never get confused with each other.
- **Multiple CardDAV servers** — configure any number of server profiles; contacts from all of them are merged and searched together.
- **Standard CardDAV discovery** — point a profile at a server root or a specific address book URL; the plugin walks `current-user-principal` → `addressbook-home-set` → address book collection automatically.
- **Follows Obsidian's UI language** — settings, notices, and card labels are shown in Korean or English depending on your Obsidian language setting (via the official `getLanguage()` API).

## Prerequisites

- A CardDAV-compatible address book reachable over HTTP(S) — e.g. [Radicale](https://radicale.org/), Nextcloud Contacts, Fastmail, or any [RFC 6352](https://www.rfc-editor.org/rfc/rfc6352) server.
- Obsidian 1.8.7 or later.

See the [Prerequisites](https://search5.github.io/harang-contacts/en/prerequisites.html) page for details.

## Installation

**harang-contacts** is not yet published to the Obsidian Community Plugins directory, so it must be installed manually for now.

### Option A — Manual install of pre-built files

Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/harang-contacts/`, then enable **Harang Contacts** under **Settings → Community plugins**.

### Option B — From source

**Requirements:** [Node.js](https://nodejs.org/) 18 or later

```bash
git clone https://github.com/search5/harang-contacts.git
cd harang-contacts
npm install
npm run build
```

Copy the resulting `main.js`, along with `manifest.json` and `styles.css`, into `<vault>/.obsidian/plugins/harang-contacts/` as in Option A, then restart Obsidian.

See the [Installation](https://search5.github.io/harang-contacts/en/installation.html) page for more detail.

## Usage

1. In **Settings → Harang Contacts**, add a server profile (name, server URL, username, password) and click **Test connection & auto-discover**.
2. In a note, type `@contact[` followed by (part of) a name and pick a contact from the autocomplete popup.
3. Click the resulting chip to see the contact's full details.

See the [Usage](https://search5.github.io/harang-contacts/en/usage.html) guide for the full walkthrough, including how multiple profiles and duplicate names are handled.

## Known limitations

- References typed by hand (without going through the `@contact[` autocomplete) resolve by name only, so they can be ambiguous if more than one contact shares that name. Always insert references via autocomplete to avoid this.
- Contacts are cached client-side with a configurable TTL (default 30 minutes); changes made on the server aren't reflected until the next refresh.

## Development

```bash
npm run dev    # esbuild in watch mode
npm run build  # type-check + production build
npm run lint   # eslint (includes eslint-plugin-obsidianmd)
```

See [Architecture](https://search5.github.io/harang-contacts/en/architecture.html) for the source layout and data flow.

## License

BSD-3-Clause — see [LICENSE](LICENSE).
