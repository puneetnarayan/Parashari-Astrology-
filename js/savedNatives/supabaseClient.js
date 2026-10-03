// Thin Supabase client wrapper for the Natives tab's cloud-storage feature.
//
// This is an ADDITIVE, parallel persistence option alongside the existing
// CSV file workflow (see csvUtil.js) — it never replaces or interferes with
// CSV import/export. See docs/savedNatives/research-notes.md for the full
// rationale (RLS decision, field mapping, dual-persistence model).
//
// Loaded via a CDN <script> tag for the official @supabase/supabase-js UMD
// build (no bundler/build step in this app), which exposes a global
// `supabase` object with a `.createClient(url, key)` factory.

(function () {
  const SUPABASE_URL = 'https://ccqhvmavmgngevihtcnf.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_ajVwLJ-Lb2tHeLFspj7gUQ_jZ_R9ide';
  const TABLE_NAME = 'parashari_natives';

  let client = null;
  let isConfigured = false;

  try {
    if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      isConfigured = true;
    }
  } catch (e) {
    // Leave client null / isConfigured false; callers must check before use.
    client = null;
    isConfigured = false;
  }

  if (typeof window !== 'undefined') {
    window.ParashariSupabase = {
      client,
      isConfigured,
      TABLE_NAME
    };
  }
})();
