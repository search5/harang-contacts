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

**Symptom:** a ``@contact[...]`` chip renders with reduced opacity and a
dashed border instead of a normal filled chip.

**Cause:** the plugin could not find a matching contact in its current
cache. This happens when the referenced contact was deleted from the
server, or when the local cache simply hasn't been refreshed since the
note was written.

**Fix:** run the **Refresh contacts** command (or click **Refresh** in
settings), then reopen the note. If the chip is still unresolved after a
refresh, the contact may genuinely no longer exist on the server.

Two contacts with the same name resolve to the wrong one
-------------------------------------------------------------

**Symptom:** a chip shows the wrong person's email/phone/organization even
though you picked a specific contact from the autocomplete list.

**Cause:** this should not normally happen — selecting a contact from the
autocomplete popup stores a hidden ``profileId``/``uid`` reference that
pins the chip to that exact contact (see :doc:`architecture`). It can only
happen if the ``@contact[name]`` syntax was typed by hand without going
through the autocomplete, in which case the plugin falls back to a
name-only search and picks whichever same-named contact happens to sort
first.

**Fix:** delete the hand-typed reference and re-insert it via the
autocomplete popup (type ``@contact[`` and pick from the list) so the
reference is pinned to the right contact.

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

**Fix:** run the full update sequence from :doc:`installation`, Method 2:

.. code-block:: bash

   git pull
   npm install
   npm run build

Then copy the freshly built ``main.js`` (and ``manifest.json``/
``styles.css`` if they changed) into
``<vault>/.obsidian/plugins/harang-contacts/`` again, and restart Obsidian.
