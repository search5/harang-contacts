Troubleshooting & FAQ
======================

"Connection failed" when testing a profile
-------------------------------------------------------------

**Symptom:** clicking **Test connection & auto-discover** shows a
"Harang contacts: Connection failed - ..." notice.

**Cause:** most commonly one of:

* The Server URL is wrong, unreachable, or missing the ``https://`` scheme.
* The username or password is incorrect.
* The server doesn't support the standard CardDAV discovery chain
  (``current-user-principal`` → ``addressbook-home-set``) and isn't
  pointed directly at an address book collection either.

**Fix:** double-check the credentials, and if discovery keeps failing, try
pointing Server URL directly at the address book collection URL instead of
the server root (for example Nextcloud's
``https://<host>/remote.php/dav/addressbooks/users/<user>/contacts/``).

A chip looks faded with a dashed border ("unresolved")
-------------------------------------------------------------

**Symptom:** a ``{{hrcard:...}}`` chip renders with reduced opacity and a
dashed border instead of a normal filled chip.

**Cause:** the plugin could not find a matching contact in its current
cache. This happens when the referenced contact was deleted from the
server, when the local cache simply hasn't been refreshed since the note
was written, or when the reference was typed by hand with a
profile name/UID that doesn't actually exist (see :doc:`architecture` -
the syntax stores profile name + CardDAV UID, not the display name, so a
hand-typed reference needs the exact UID to resolve at all).

**Fix:** run the **Refresh contacts** command (or click **Refresh** in
settings), then reopen the note. If the chip is still unresolved after a
refresh, delete it and re-insert it via the ``{{hrcard:`` autocomplete
popup instead of typing it by hand.

The plugin doesn't appear after installing
------------------------------------------------

**Fix:** confirm ``main.js``, ``manifest.json``, and ``styles.css`` are
directly inside ``<vault>/.obsidian/plugins/harang-contacts/`` (not a
subfolder), that the plugin is enabled under
**Settings → Community plugins**, and that Obsidian is on version 1.12.7 or
later (see :doc:`prerequisites`). Fully restart Obsidian after installing
or updating the files.

The plugin doesn't update after ``git pull``
--------------------------------------------------

**Symptom:** you pulled the latest source changes, but Obsidian still
behaves like the old version.

**Cause:** installing from source requires an explicit rebuild and a
manual copy step — pulling new source alone does not update the files
Obsidian actually loads.

**Fix:** run the full update sequence from :doc:`installation`, Method 3:

.. code-block:: bash

   git pull
   npm install
   npm run build

Then copy the freshly built ``main.js`` (and ``manifest.json``/
``styles.css`` if they changed) into
``<vault>/.obsidian/plugins/harang-contacts/`` again, and restart Obsidian.
