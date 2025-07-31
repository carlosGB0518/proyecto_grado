// src/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vbwmnzvnuolpxhgbyjzt.supabase.co'; // Reemplaza con tu URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZid21uenZudW9scHhoZ2J5anp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTc5NTAsImV4cCI6MjA2OTQ5Mzk1MH0.N-0guWKJMaFeUmHhJhymfLiYPW9pqA2OjdqLXP3NFIE'; // Reemplaza con tu Anon key

export const supabase = createClient(supabaseUrl, supabaseKey);
