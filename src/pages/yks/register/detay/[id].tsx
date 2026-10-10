import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface DetailFormData {
  date_of_birth: string
  tc_id: string
  phone_number: string
  address: string
}

export default function DetailForm() {
  const router = useRouter()
  const { id } = router.query
  const { register, handleSubmit, formState: { errors } } = useForm<DetailFormData>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (data: DetailFormData) => {
    if (!id || typeof id !== 'string') return

    setIsLoading(true)
    setError('')

    try {
      // 1. Create user profile with detail data
      const { error: insertError } = await supabase.from('user_profiles').insert({
        user_id: id,
        date_of_birth: data.date_of_birth || null,
        tc_id: data.tc_id || null,
        phone_number: data.phone_number || null,
        address: data.address || null,
        updated_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      // 2. Update registration step
      const { error: updateError } = await supabase
        .from('users')
        .update({ yks_registration_step: 2 })
        .eq('id', id)

      if (updateError) throw updateError

      // 3. Redirect to panel
      router.push('/yks/panel')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(message)
      console.error('Detail form error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!id) {
    return <div>Yükleniyor...</div>
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>Profil Detayları</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Profilinizi tamamlamak için aşağıdaki alanları doldurunuz.
      </p>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Doğum Tarihi
          </label>
          <input
            {...register('date_of_birth')}
            type="date"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.date_of_birth && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.date_of_birth.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            TC Kimlik (İsteğe Bağlı)
          </label>
          <input
            {...register('tc_id')}
            type="text"
            placeholder="TC Kimlik Numarası"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Telefon
          </label>
          <input
            {...register('phone_number')}
            type="tel"
            placeholder="Telefon Numarası"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Adres
          </label>
          <textarea
            {...register('address')}
            placeholder="Adres"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '80px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
        </button>
      </form>
    </div>
  )
}
