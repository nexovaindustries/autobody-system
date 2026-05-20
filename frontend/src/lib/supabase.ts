import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ciyvjqkbklkqwgtosfvd.supabase.co';
const getAnonKey = () => {
  return (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY') || 'placeholder-anon-key-please-configure';
};

export const supabase = createClient(supabaseUrl, getAnonKey());

// Function to refresh the client instance if a new key is saved in localStorage
export const refreshSupabaseClient = () => {
  (supabase as any).supabaseUrl = supabaseUrl;
  (supabase as any).supabaseKey = getAnonKey();
  // We can just recreate it or reload the window for simplicity, but let's re-export a dynamic helper or simply trigger a window reload after saving.
};

