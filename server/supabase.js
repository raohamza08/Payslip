const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://njttaimvlfwecqeroitx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
    console.warn('[SUPABASE] CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing! Backend will have limited permissions.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY || 'sb_publishable_bNB6vfliFR3ofE0n-4QKpw_65aPYgZX');

module.exports = supabase;
