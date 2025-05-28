import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yqbpffomurjqialithlg.supabase.co';

const key = import.meta.env.VITE_SUPBASE_KEY;

if (!key) {
  console.error('key not set');
}

export const supabase = createClient(supabaseUrl, key!);
