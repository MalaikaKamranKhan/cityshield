import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tewgfglnrsqhnnrbjovn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRld2dmZ2xucnNxaG5ucmJqb3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MDA1MTAsImV4cCI6MjA4NzM3NjUxMH0.BYUHpHtttgQcpyZzEVOeYL1pYsY6b9QGcbASXVO-PJs'
export const supabase = createClient(supabaseUrl, supabaseKey)