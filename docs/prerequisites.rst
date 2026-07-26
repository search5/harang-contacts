Prerequisites
=============

Before using **harang-contacts**, make sure the following are in place.

1. A reachable CardDAV server
---------------------------------

You need at least one CardDAV-compatible address book you can reach over
HTTP(S) — for example `Radicale <https://radicale.org/>`_, Nextcloud
Contacts, Fastmail, or any other server that implements
`RFC 6352 <https://www.rfc-editor.org/rfc/rfc6352>`_. The plugin only reads
from this server; it never writes, so a read-only account is fine if your
server supports one.

You will need:

.. list-table::
   :header-rows: 1

   * - Item
     - Notes
   * - Server URL
     - Either the CardDAV base URL or the exact address book collection URL.
       The plugin auto-discovers the address book from either.
   * - Username
     - Your CardDAV account's username.
   * - Password
     - Your CardDAV account's password, or an app-specific password if your
       server supports one (recommended over your main account password).

2. Obsidian 1.8.7 or later
------------------------------

The plugin uses Obsidian's official ``getLanguage()`` API (available since
1.8.7) to match its UI language to your Obsidian language setting, so this
is the minimum supported Obsidian version.

Once both are in place, continue to :doc:`installation`.
