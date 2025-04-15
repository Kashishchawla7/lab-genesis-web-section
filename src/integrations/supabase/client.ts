
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://skvdyypcahkmgmynhcoa.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrdmR5eXBjYWhrbWdteW5oY29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ3MzcxMTgsImV4cCI6MjA2MDMxMzExOH0.ITkwy3t5R6DWhY-WAXvW_PJJk0gygAk5J_vQnG9EytU";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
