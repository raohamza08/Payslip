const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://njttaimvlfwecqeroitx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_bNB6vfliFR3ofE0n-4QKpw_65aPYgZX';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
