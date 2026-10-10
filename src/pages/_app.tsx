import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabase = createClient(supabaseUrl, supabaseKey)

// Global responsive typography - all text automatically scales with wider, more gradual range
const globalStyles = `
  :root {
    --base-font-size: 16px;
    --scale-vw: 1.5vw;
  }

  html {
    font-size: clamp(14px, 1.5vw, 22px);
  }

  /* Force ALL elements to have responsive font sizing - wider range for smoother scaling */
  * {
    font-size: clamp(12px, 1.5vw, 22px) !important;
  }

  h1 { font-size: clamp(28px, 6vw, 56px) !important; }
  h2 { font-size: clamp(24px, 5vw, 48px) !important; }
  h3 { font-size: clamp(20px, 4vw, 40px) !important; }
  h4 { font-size: clamp(18px, 3.5vw, 32px) !important; }
  h5 { font-size: clamp(16px, 3vw, 28px) !important; }
  h6 { font-size: clamp(14px, 2.5vw, 24px) !important; }

  p { font-size: clamp(12px, 1.5vw, 22px) !important; }
  span { font-size: clamp(12px, 1.5vw, 22px) !important; }
  div { font-size: clamp(12px, 1.5vw, 22px) !important; }
  button { font-size: clamp(12px, 1.5vw, 22px) !important; }
  a { font-size: clamp(12px, 1.5vw, 22px) !important; }
  label { font-size: clamp(12px, 1.5vw, 22px) !important; }

  /* Card elements - responsive with wider range */
  [class*="card"],
  [class*="item"],
  [class*="box"],
  [class*="container"],
  [class*="task"],
  [class*="program"],
  [class*="calendar"],
  [class*="schedule"] {
    font-size: clamp(12px, 1.5vw, 22px) !important;
  }

  [class*="card"] *,
  [class*="item"] *,
  [class*="box"] *,
  [class*="container"] *,
  [class*="task"] *,
  [class*="program"] *,
  [class*="calendar"] *,
  [class*="schedule"] * {
    font-size: clamp(12px, 1.5vw, 22px) !important;
  }

  small { font-size: clamp(11px, 1.3vw, 18px) !important; }

  /* PDF and document text */
  [class*="pdf"],
  [class*="document"],
  [class*="solution"],
  [class*="answer"] {
    font-size: clamp(12px, 1.5vw, 22px) !important;
  }

  [class*="pdf"] *,
  [class*="document"] *,
  [class*="solution"] *,
  [class*="answer"] * {
    font-size: clamp(12px, 1.5vw, 22px) !important;
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
