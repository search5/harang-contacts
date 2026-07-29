Installation
============

Make sure you have completed the steps in :doc:`prerequisites` first.

**harang-contacts** is listed in Obsidian's official Community Plugins
directory, so the recommended way to install it is directly from within
Obsidian.

Method 1 — Community Plugins browser (recommended)
--------------------------------------------------------

1. Open **Settings → Community plugins** in Obsidian.
2. Click **Browse**, then search for **"Harang Contacts"**.
3. Click **Install**, then **Enable**.

Obsidian will also notify you of future updates and let you update the
plugin from the same screen.

Method 2 — Manual install of pre-built files
-------------------------------------------------

Use this method if you already have a built copy of the plugin (``main.js``,
``manifest.json``, ``styles.css``) — for example from a release archive —
and want to install it without going through the Community Plugins browser.

1. In your vault, create the folder
   ``<vault>/.obsidian/plugins/harang-contacts/`` if it doesn't already
   exist.
2. Copy ``main.js``, ``manifest.json``, and ``styles.css`` into that folder.
3. Restart Obsidian, then enable **Harang Contacts** under
   **Settings → Community plugins**.

Method 3 — Clone the Git repository and build from source
-------------------------------------------------------------

Use this method if you want to build from a specific commit or contribute
to the plugin.

**Requirements:** `Node.js <https://nodejs.org/>`_ 18 or later.

.. code-block:: bash

   git clone https://github.com/search5/harang-contacts.git
   cd harang-contacts
   npm install
   npm run build

This produces ``main.js`` in the project root. Copy it, together with
``manifest.json`` and ``styles.css``, into
``<vault>/.obsidian/plugins/harang-contacts/`` as described in Method 2,
then restart Obsidian and enable the plugin.

.. note::

   ``npm run dev`` starts esbuild in watch mode, rebuilding ``main.js`` on
   every source change — useful when iterating on the plugin itself.

Once installed, continue to :doc:`usage` to set up a CardDAV server profile.
