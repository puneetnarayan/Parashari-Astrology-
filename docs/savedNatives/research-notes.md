# Saved Natives — Supabase cloud storage (research notes)

## Summary

The "Natives" tab originally stored client birth-detail records only in a
local CSV file (`js/savedNatives/csvUtil.js`, UI/state logic in `js/ui.js`
under the `sn*` prefix). This was extended, additively, with a second,
parallel persistence option: a Supabase-backed cloud table. Neither
persistence mode is primary — CSV remains fully functional exactly as
before, and Supabase is an optional "also save/search/edit/delete in the
cloud" capability layered next to it.

## Why a new adjacent section instead of extending the existing CSV table

The existing "Search & Load" table and its state (`snState.records`) are
tightly coupled to the in-memory/CSV-file model: rows are addressed by
array index, Load/Delete mutate `snState.records` directly, and saving
writes the whole file back out. Cloud rows are a different data source
(a remote table, addressed by UUID, queried live rather than held
in-memory in full) with different semantics (partial search via `ilike`,
not a full local list). Overloading the same table/state would require
tagging every row with its origin (CSV vs cloud) and branching Load/Delete/
Save behavior throughout, risking regressions in the CSV path the user
explicitly asked not to disturb.

Instead, a new "Cloud Natives (Supabase)" section was added right after
the existing "Search & Load" table, with its own search box, its own
table/output area, and its own Edit/Delete actions — following the same
visual conventions (`.output-box.pastel-*`, same table/column layout, same
`<button data-sn-*>` delegation pattern) as the existing CSV table. The
existing "Save / Add Native" form is reused as-is (not duplicated): a new
"Save to Supabase" button reads the same form fields and either inserts a
new cloud row or updates the one currently being edited.

## Supabase project / table

- Project URL: `https://ccqhvmavmgngevihtcnf.supabase.co`
- Table: `public.parashari_natives` (pre-existing, not created or altered
  by this change)
- Columns: `id` (uuid, PK, auto), `name`, `sex`, `location`, `city`,
  `state`, `country`, `birth_date`, `birth_time`, `latitude`, `longitude`,
  `timezone_mode`, `utc_offset`, `time_zone`, `notes` (all `text`),
  `created_at`, `updated_at` (`timestamptz`, auto on insert; `updated_at`
  is NOT auto-updated by a trigger, so the client sets it explicitly on
  every UPDATE).
- RLS: enabled, with explicit "fully open" policies for the `anon` role
  (SELECT/INSERT/UPDATE/DELETE all allowed). This was an explicit, informed
  decision by the project owner, made necessary by the fact that this app
  has no authentication/login system of any kind — there is no user
  identity to scope rows to. The alternative (no RLS policies at all) would
  make the table completely inaccessible from the client; the policy is
  scoped only to this one table and does not affect the other apps sharing
  this Supabase project. Because of this, the UI surfaces a plain-language
  note next to the "Supabase: Connected" status explaining that the table
  currently has no access restriction, so anyone with the site URL could
  in principle read or write these records.
- No schema changes, migrations, or new tables were made as part of this
  feature — the table was pre-provisioned exactly as specified.

## Client library loading (no build step)

This app has no bundler/npm build (`package.json` has only a static
`start` script), so the official `@supabase/supabase-js` v2 UMD build is
loaded via a plain `<script>` tag from a CDN
(`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js`),
consistent with how every other script in this app is loaded. It defines a
global `window.supabase.createClient(...)`.

`js/savedNatives/supabaseClient.js` wraps this into a single client,
created once at page load, and exposes it as:

```js
window.ParashariSupabase = {
  client,          // the Supabase client instance (or null if unavailable)
  isConfigured,    // true only if the client was created successfully
  TABLE_NAME        // 'parashari_natives'
};
```

If the CDN script fails to load (e.g. no network, or a restrictive egress
policy blocking the CDN host), `isConfigured` stays `false` and `client`
stays `null`; every call site checks `isConfigured`/the client first and
shows an explicit "Not Connected" status or error message rather than
throwing or silently doing nothing.

## Field-name mapping

Internal in-memory record fields (same names used by the CSV workflow) map
to Supabase columns as follows:

| Internal field  | Supabase column                                      |
|-----------------|-------------------------------------------------------|
| `Name`          | `name`                                                 |
| `Sex`           | `sex`                                                   |
| `Location`      | `location`                                             |
| `City`          | `city`                                                 |
| `State`         | `state`                                                |
| `Country`       | `country`                                              |
| `BirthDate`     | `birth_date`                                           |
| `BirthTime`     | `birth_time`                                           |
| `Latitude`      | `latitude`                                             |
| `Longitude`     | `longitude`                                            |
| `TimezoneMode`  | `timezone_mode`                                        |
| `UTCOffset`     | `time_zone` (when `TimezoneMode === 'iana'`) **or** `utc_offset` (when `TimezoneMode === 'offset'`) |
| `Notes`         | `notes`                                                |

The internal `UTCOffset` field is overloaded in the existing CSV format: it
holds either an IANA zone name or a literal UTC offset string, depending on
`TimezoneMode`. Since the Supabase table has two separate columns
(`utc_offset` and `time_zone`) for exactly this distinction, the mapping
writes to whichever column matches the current mode and clears the other,
and reconstructs `UTCOffset` from whichever of the two is populated when
reading a row back. This is implemented in `snRecordToSupabaseRow()` and
`snSupabaseRowToRecord()` in `js/ui.js`.

## CSV vs. Supabase — dual persistence model

- **CSV** (`csvUtil.js` + the "CSV File" / "Save / Add Native" / "Search &
  Load" sections) is unchanged: Connect/Start New/Save still read and
  write a local CSV file exactly as before, compatible with the sibling KP
  app's format. This remains the primary, offline-capable, file-portable
  storage mode and requires no network access.
- **Supabase** (`supabaseClient.js` + the new "Cloud Natives (Supabase)"
  section) is a separate, optional, network-dependent mode: the same
  "Save / Add Native" form can also be pushed to the cloud table via
  "Save to Supabase", and cloud records can be searched by name, edited
  (which re-populates the form and switches the button to an UPDATE via an
  internal `editingSupabaseId`-style state variable, `snEditingSupabaseId`,
  cleared by "Clear Form"), and deleted (with a `confirm()` prompt,
  consistent with the existing CSV delete confirmation pattern).
- The two stores are **not** synchronized with each other. Saving to CSV
  does not push to Supabase and vice versa; a user who wants a record in
  both places saves it via both buttons. This keeps the two code paths
  fully independent, so a bug or outage in one can never corrupt or block
  the other.
- All Supabase errors (connection check, insert, update, delete, search)
  are surfaced as explicit on-screen status text — never only logged to
  the console, and record contents (name/birthdate/location) are never
  written to the console, only generic messages like "Failed to save
  native" plus the Supabase error message where available (which is about
  the operation, not the data).

## Verification / known limitation

This sandboxed test environment's egress policy blocks the CDN hosts used
to load `@supabase/supabase-js` (jsdelivr, unpkg, cdnjs all returned a
proxy-level 403), so the Supabase client library could not actually load
during Playwright testing here, and the "Supabase: Connected" live
round-trip (add/search/edit/delete against the real table) could not be
exercised in this environment. The connection-check code path was
confirmed to fail gracefully and visibly ("Not Connected (client library
failed to load)") rather than silently, which is the correct behavior for
this failure mode. The CSV workflow (Start New / Save / Add Native /
Search & Load) and all 60 tabs were confirmed to render and operate with
zero console/page errors in this environment.
