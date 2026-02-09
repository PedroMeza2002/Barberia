const SUPABASE_URL = 'https://hcueuizcuiwscxqcmabn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4nmQhV4bchtTGumi5J2qSA_7Rli-O1m';

// ⚠️ NO usar "supabase" como nombre
window.db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
