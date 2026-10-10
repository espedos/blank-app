import type { AppProps } from 'next/app'
import '../styles/globals.css'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
