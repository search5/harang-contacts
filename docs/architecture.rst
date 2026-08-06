Architecture
============

Source layout
--------------

All of the plugin's logic lives under ``src/``:

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - File
     - Responsibility
   * - ``main.ts``
     - Plugin entry point: loads settings, wires up the settings tab,
       editor suggest, live preview extension, and post-processor; adds the
       **Refresh contacts** command.
   * - ``types.ts``
     - Shared types: ``Contact``, ``CardDavProfile``,
       ``HarangContactsSettings``.
   * - ``settings.ts`` / ``settingsTab.ts``
     - Default settings and the settings UI. ``settingsTab.ts`` implements
       Obsidian's declarative ``getSettingDefinitions()`` API (available
       since 1.13.0) exclusively, returning a tree of setting definitions
       rather than imperatively building the UI in a ``display()`` method;
       this is why the plugin's minimum supported Obsidian version is
       1.13.4.
   * - ``i18n.ts``
     - Looks up the current Obsidian UI language via the official
       ``getLanguage()`` API and returns matching strings from a small
       ``ko``/``en`` dictionary (falling back to English).
   * - ``carddav/client.ts``
     - A minimal read-only CardDAV client: address book discovery
       (``PROPFIND``/``current-user-principal``/``addressbook-home-set``)
       and contact fetching (``REPORT`` ``addressbook-query``), over
       Obsidian's ``requestUrl``.
   * - ``carddav/vcard.ts``
     - A small vCard 3/4 parser extracting ``FN``, ``UID``, ``EMAIL``,
       ``TEL``, and ``ORG`` into a ``Contact``.
   * - ``carddav/store.ts``
     - ``ContactStore``: merges and caches contacts from every configured
       profile, with TTL-based staleness and search/lookup helpers.
   * - ``editorSuggest.ts``
     - ``HrcardEditorSuggest``: triggers on ``{{hrcard:``. A single staged
       suggester (no separate free-text trigger) - it splits the typed
       query on ``:`` to figure out which stage it's in - profile name,
       then that profile's contacts by name - and inserts
       ``{{hrcard:<profileId>:<uid>}}``.
   * - ``render/livePreview.ts``
     - A CodeMirror 6 ``ViewPlugin`` that replaces ``{{hrcard:...}}`` ranges
       with chip widgets in Live Preview, skipping ranges the cursor or
       selection currently overlaps so the raw syntax stays editable.
   * - ``render/postProcessor.ts``
     - A Markdown post-processor that does the same replacement for Reading
       view, by walking rendered text nodes.
   * - ``render/chip.ts`` / ``render/card.ts``
     - The chip DOM element, and the click-to-open detail card (a
       manually positioned floating panel, closed on outside click or
       Esc).

Data flow
----------

.. code-block:: text

   settingsTab.ts        -->  CardDavProfile[] (server URL, credentials)
        |
        v
   carddav/client.ts      -->  PROPFIND/REPORT over requestUrl
        |                      (discovery + address book fetch)
        v
   carddav/vcard.ts        -->  parses each vCard into a Contact
        |
        v
   carddav/store.ts          -->  merged, cached Contact[] across profiles
        |
        +--> editorSuggest.ts (HrcardEditorSuggest)  -->  autocomplete while typing
        |
        +--> render/livePreview.ts   -->  chip widgets (Live Preview)
        |
        +--> render/postProcessor.ts -->  chip elements (Reading view)
                 |
                 v
          render/chip.ts + render/card.ts  -->  click-to-open detail card

Reference syntax
------------------

A resolved reference is stored as ``{{hrcard:<profileId>:<uid>}}``.
``profileId`` and ``uid`` are used to look the contact up precisely, so
two contacts that happen to share a display name (on the same server or
different ones) never get confused with each other - the display name
itself isn't part of the stored syntax at all, only fetched at render time
from whatever the store currently has for that uid. The profile's internal
``id`` (a string generated once when the profile is created and never
changed afterwards) is used rather than its user-assigned ``name``, so
renaming a profile in settings no longer breaks references written after
this change - ``editorSuggest.ts`` still searches and lists profiles by
their display name at stage 1 of the autocomplete, it just silently
substitutes the id when composing the inserted text. This is **not**
backward compatible: references inserted before this change stored the
profile's *name* instead, and there is no id-or-name fallback resolver, so
such a reference stops resolving as soon as its profile is renamed (or
immediately, if the segment simply no longer matches any current profile)
and must be deleted and re-inserted via the ``{{hrcard:`` autocomplete.
``{{...}}`` isn't Obsidian wikilink syntax, so unlike a hypothetical
``[[...]]`` form it's never intercepted by Obsidian's own link parser -
Reading view and Live Preview both match it directly against raw text. A
hand-typed reference needs the exact profile id and CardDAV UID to
resolve, neither of which is shown anywhere in the UI and so isn't
practical outside of copying them from an existing reference - in
practice, always insert references via the ``{{hrcard:`` autocomplete.

No runtime dependencies
---------------------------

Beyond what Obsidian itself provides (the ``obsidian`` package, CodeMirror
6), the plugin has no runtime dependencies — the CardDAV client and vCard
parser are both hand-written rather than pulled in from npm, keeping the
bundle small and avoiding exposure to a third-party HTTP/XML parsing
library's own vulnerabilities.
