import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ftsmqcgzpzjcebrdhysw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0c21xY2d6cHpqY2VicmRoeXN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5MjY3ODgsImV4cCI6MjEwMDUwMjc4OH0.aAPTGTkznmpDg2DT0ekm6mHk4lf26YhvzEGmERaUp6g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)