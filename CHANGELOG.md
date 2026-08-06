# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed

- The `{{hrcard:<id>:<uid>}}` reference inserted by the `{{hrcard:` autocomplete now embeds the profile's stable internal id instead of its display name. Renaming a CardDAV/Google profile in settings no longer breaks references inserted going forward. **Not backward compatible:** references already inserted before this change stored the profile's *name* instead, and there is no id-or-name fallback resolver — any such reference will need to be manually deleted and re-inserted via the `{{hrcard:` autocomplete after this ships.
- `Contact` now carries both `profileId` (identity, used for reference resolution) and `profileName` (a display-only label shown as the "source" on the contact card popup, refreshed on each periodic resync so it stays reasonably current even though it's no longer the source of truth for identity).
