
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// These environment variables must be defined in your .env file
const supabaseUrl = "https://alngyeloprmtbenylool.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsbmd5ZWxvcHJtdGJlbnlsb29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDA4MTEsImV4cCI6MjA2MzUxNjgxMX0.8QzraoF6jXU1FHT1BguGbWIzajSAJZb2J-3PqZwHj9Y";

// Runtime check for safety in development
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

// Create and export Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
