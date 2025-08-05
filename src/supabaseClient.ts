// Utility to initialize Supabase client
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Sign in anonymously on app start to bypass authentication
export const initializeAnonymousAuth = async () => {
  try {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous auth failed:', error.message);
    } else {
      console.log('Anonymous authentication successful');
    }
  } catch (err) {
    console.warn('Anonymous auth initialization failed:', err);
  }
};
