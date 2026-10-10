import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

// Global responsive typography - all text automatically scales
const globalStyles = `
  * {
    --base-font-size: 16px;
  }

  html {
    --scale-factor: 1;
    font-size: clamp(14px, 2vw, 20px);
  }

  body, p, span, div, button, a, label, input, textarea, select {
    font-size: inherit;
  }

  h1 { font-size: clamp(32px, 8vw, 56px); }
  h2 { font-size: clamp(28px, 7vw, 48px); }
  h3 { font-size: clamp(24px, 6vw, 40px); }
  h4 { font-size: clamp(20px, 5vw, 32px); }
  h5 { font-size: clamp(18px, 4vw, 28px); }
  h6 { font-size: clamp(16px, 3vw, 24px); }

  small, .text-small { font-size: clamp(12px, 1.8vw, 14px); }
  .text-medium { font-size: clamp(14px, 2.2vw, 16px); }
  .text-large { font-size: clamp(16px, 2.5vw, 18px); }
  .text-xlarge { font-size: clamp(18px, 3vw, 20px); }

  /* Card and container typography - ensures nested text scales */
  [class*="card"], [class*="item"], [class*="box"], [class*="container"] {
    font-size: inherit;
  }

  [class*="card"] p,
  [class*="item"] p,
  [class*="box"] p,
  [class*="container"] p {
    font-size: clamp(14px, 2vw, 16px);
  }

  [class*="card"] h2,
  [class*="item"] h2,
  [class*="box"] h2 {
    font-size: clamp(18px, 4vw, 24px);
  }

  [class*="card"] h3,
  [class*="item"] h3,
  [class*="box"] h3 {
    font-size: clamp(16px, 3vw, 20px);
  }

  /* Ensure inline styles with font-size also use clamp-like behavior */
  [style*="font-size"] {
    font-size: clamp(14px, 2vw, 16px) !important;
  }
`

export default function App({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Inject global responsive typography styles
    const styleEl = document.createElement('style')
    styleEl.textContent = globalStyles
    document.head.appendChild(styleEl)

    setMounted(true)

    return () => {
      styleEl.remove()
    }
  }, [])

  if (!mounted) {
    return null
  }

  return <Component {...pageProps} />
}
