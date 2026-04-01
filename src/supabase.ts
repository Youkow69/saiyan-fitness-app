import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kwgqkycuviybgzyharwb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Z3FreWN1dml5Ymd6eWhhcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjgzNjksImV4cCI6MjA5MDY0NDM2OX0.JH5B4BIVIk6tK6_3nRxsgebxq-SY-mizNRASLzIyJhs'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
