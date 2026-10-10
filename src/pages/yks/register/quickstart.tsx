import { useForm } from 'react-hook-form'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface QuickstartFormData {
  name: string
  surname: string
  email: string
  password: string
  class: string
  school: string
  is_graduated: boolean
  graduation_attempt?: number
  target_track: 'sayisal' | 'esit_agirlik'
}

export default function QuickstartForm() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<QuickstartFormData>()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const isGraduated = watch('is_graduated')

  const onSubmit = async (data: QuickstartFormData) => {
    setIsLoading(true)
    setError('')

    try {
      // 1. Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // 2. Create user profile with quickstart data
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: data.name,
        surname: data.surname,
        class: data.class,
        school_name: data.school,
        is_graduated: data.is_graduated,
        graduation_attempt: data.is_graduated ? data.graduation_attempt || 1 : null,
        target_track: data.target_track,
        exam_type: 'yks_tyt',
        yks_registration_step: 1,
        email: data.email,
      })

      if (insertError) throw insertError

      // 3. Redirect to detail form
      router.push(`/yks/register/detay/${authData.user.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bir hata oluştu'
      setError(message)
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>YKS'ye Hoşgeldiniz!</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Hızlı kayıt formunu doldurun, sonra profil detaylarınızı tamamlayın.
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
            İsim
          </label>
          <input
            {...register('name', { required: 'İsim gerekli' })}
            type="text"
            placeholder="İsim"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.name && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.name.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Soy İsim
          </label>
          <input
            {...register('surname', { required: 'Soy isim gerekli' })}
            type="text"
            placeholder="Soy İsim"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.surname && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.surname.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            E-posta
          </label>
          <input
            {...register('email', {
              required: 'E-posta gerekli',
              pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Geçerli e-posta giriniz' }
            })}
            type="email"
            placeholder="E-posta"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.email && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.email.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Şifre
          </label>
          <input
            {...register('password', {
              required: 'Şifre gerekli',
              minLength: { value: 6, message: 'Şifre en az 6 karakter olmalı' }
            })}
            type="password"
            placeholder="Şifre"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
          {errors.password && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.password.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Sınıf
          </label>
          <select
            {...register('class', { required: 'Sınıf seçiniz' })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Sınıf Seç</option>
            <option value="10">10. Sınıf</option>
            <option value="11">11. Sınıf</option>
            <option value="12">12. Sınıf</option>
            <option value="graduated">Mezun</option>
          </select>
          {errors.class && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.class.message}</span>}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
            Okul Adı
          </label>
          <input
            {...register('school')}
            type="text"
            placeholder="Okul Adı"
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              {...register('is_graduated')}
              type="checkbox"
              style={{ width: '16px', height: '16px' }}
            />
            <span>Mezunum</span>
          </label>
        </div>

        {isGraduated && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 500 }}>
              Kaçıncı Girişim
            </label>
            <select
              {...register('graduation_attempt')}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value={1}>1. Girişim</option>
              <option value={2}>2. Girişim</option>
              <option value={3}>3. Girişim</option>
            </select>
          </div>
        )}

        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ marginBottom: '8px', fontWeight: 500 }}>Hedef Alan</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                {...register('target_track', { required: 'Hedef alan seçiniz' })}
                type="radio"
                value="sayisal"
                style={{ width: '16px', height: '16px' }}
              />
              <span>Sayısal</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                {...register('target_track', { required: 'Hedef alan seçiniz' })}
                type="radio"
                value="esit_agirlik"
                style={{ width: '16px', height: '16px' }}
              />
              <span>Eşit Ağırlık</span>
            </label>
          </div>
          {errors.target_track && <span style={{ color: '#c33', fontSize: '12px' }}>{errors.target_track.message}</span>}
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
          {isLoading ? 'Kaydediliyor...' : 'Devam Et →'}
        </button>
      </form>
    </div>
  )
}
