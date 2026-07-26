Usage
=====

Adding a CardDAV server profile
------------------------------------

1. Open **Settings → Harang Contacts**.
2. Click **Add a new server profile**.
3. Fill in the profile:

.. list-table::
   :header-rows: 1

   * - Field
     - Description
   * - Profile name
     - A label for this server, shown when a contact's name is ambiguous
       across servers.
   * - Server URL
     - The CardDAV base URL, or the exact address book collection URL.
   * - Username / Password
     - Your CardDAV account credentials.

4. Click **Test connection & auto-discover**. The plugin walks the standard
   CardDAV discovery chain (``current-user-principal`` →
   ``addressbook-home-set`` → address book collection) and fills in the
   resolved address book URL automatically. If your Server URL already
   points directly at an address book collection, it is used as-is without
   further discovery.

You can add multiple profiles (for multiple servers, or multiple address
books on the same server); contacts from all of them are merged.

Referencing a contact in a note
-------------------------------------

Type ``@contact[`` followed by (part of) a name:

.. code-block:: text

   Meeting notes with @contact[Jane

An autocomplete popup lists matching contacts from all configured servers'
cached address books. If a name matches more than one contact, the popup
also shows each candidate's organization and server profile name so you can
tell them apart.

Selecting a suggestion inserts the full reference and renders it as a
chip — the contact's name, plus their email address if they have one, in a
rounded pill. This works the same way in both Live Preview and Reading
view.

.. note::

   The inserted syntax stores a hidden reference (server profile + CardDAV
   UID) alongside the display name, so the chip always resolves to the
   exact contact you picked — even if another contact happens to share the
   same name.

Viewing contact details
-----------------------------

Click a chip to open a small card with the contact's email, phone, and
organization (whichever of those fields the CardDAV record has). Click
anywhere outside the card, or press **Esc**, to close it.

If a chip looks faded with a dashed border, the plugin could not resolve it
to a known contact — most often because the address book cache is stale.
See :doc:`troubleshooting`.

Refreshing the address book cache
---------------------------------------

Contacts are cached and refreshed automatically once the cache lifetime
(configurable in settings, default 30 minutes) elapses. To refresh
immediately:

* Run the **Refresh contacts** command from the command palette, or
* Click **Refresh** next to **Refresh all address books now** in settings.
