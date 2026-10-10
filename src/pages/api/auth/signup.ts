import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '' // Admin key - must be in .env.local
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, userData } = req.body

  try {
    // 1. Create user with email auto-confirmation
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for testing
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // 2. Create user profile
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: authData.user.id,
      ...userData,
      email,
    })

    if (insertError) throw insertError

    return res.status(200).json({
      success: true,
      userId: authData.user.id,
      redirectUrl: `/yks/register/detay/${authData.user.id}`
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bir hata oluştu'
    console.error('Signup error:', err)
    return res.status(400).json({ error: message })
  }
}
