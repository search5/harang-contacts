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
       both Obsidian's declarative ``getSettingDefinitions()`` API
       (1.13.0+) and the classic imperative ``display()`` API, so the
       plugin's minimum supported Obsidian version can stay below 1.13.0
       while still getting the newer, searchable settings UI where it's
       available.
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
     - ``ContactEditorSuggest``: triggers on ``@contact[``, searches the
       cached contact store, and inserts the selected contact's reference.
   * - ``render/contactRef.ts``
     - Parses and formats the ``name|profileId|uid`` reference syntax, and
       resolves a reference back to a ``Contact`` (falling back to a
       name-only search if the UID is no longer in the cache).
   * - ``render/livePreview.ts``
     - A CodeMirror 6 ``ViewPlugin`` that replaces ``@contact[...]`` ranges
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
        +--> editorSuggest.ts        -->  autocomplete while typing
        |
        +--> render/livePreview.ts   -->  chip widgets (Live Preview)
        |
        +--> render/postProcessor.ts -->  chip elements (Reading view)
                 |
                 v
          render/chip.ts + render/card.ts  -->  click-to-open detail card

Reference syntax
------------------

A resolved reference is stored as ``@contact[name|profileId|uid]``. Only
``name`` is shown in the rendered chip; ``profileId`` and ``uid`` are used
to look the contact up precisely, so two contacts that happen to share a
display name (on the same server or different ones) never get confused
with each other. References typed by hand without the ``|profileId|uid``
suffix still resolve, by falling back to a plain name search.

No runtime dependencies
---------------------------

Beyond what Obsidian itself provides (the ``obsidian`` package, CodeMirror
6), the plugin has no runtime dependencies — the CardDAV client and vCard
parser are both hand-written rather than pulled in from npm, keeping the
bundle small and avoiding exposure to a third-party HTTP/XML parsing
library's own vulnerabilities.
