import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../supabaseClient';

export const AuthView = () => (
  <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} />
)
