const { createClient } = require('@supabase/supabase-js');
const { env } = require('../../config/env');

// We use process.env here directly instead of env to allow mock fallback in tests
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'mock-key'
);

module.exports = supabase;
