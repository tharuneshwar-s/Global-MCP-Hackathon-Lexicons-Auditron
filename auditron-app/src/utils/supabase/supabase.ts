import { createClient } from './client'

export const supabase = createClient()

// Export types
export type { User, Session } from '@supabase/supabase-js'
