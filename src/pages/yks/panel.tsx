import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

interface User {
  id: string
  name: string
  surname: string
  class: string
  target_track: string
  yks_start_date?: string
}

interface DailyProgram {
  program_id: string
  program_date: string
  item_count: number
  total_duration: number
}

export default function YKSPanel() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [todayProgram, setTodayProgram] = useState<DailyProgram | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !authUser) {
          router.push('/yks/register/quickstart')
          return
        }

        // Get user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError) throw userError
        if (!userData) throw new Error('User not found')

        setUser(userData)

        // Get today's program (mock for now)
        const today = new Date().toISOString().split('T')[0]
        setTodayProgram({
          program_id: 'mock-1',
          program_date: today,
          item_count: 9,
          total_duration: 210
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Veri yüklenirken bir hata oluştu'
        setError(message)
        console.error('Load user error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Yükleniyor...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '20px',
        backgroundColor: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        color: '#c33',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        Hata: {error}
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ marginBottom: '40px' }}>
        <h1>Hoşgeldiniz, {user.name}!</h1>
        <p style={{ color: '#666' }}>
          {user.target_track === 'sayisal' ? 'Sayısal' : 'Eşit Ağırlık'} | Sınıf: {user.class}
        </p>
      </div>

      {/* Today's Program Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        border: '1px solid #eee',
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginTop: 0 }}>Bugünkü Program</h2>

        {todayProgram && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div>
                <p style={{ color: '#666', marginBottom: '4px' }}>Görev Sayısı</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {todayProgram.item_count}
                </p>
              </div>
              <div>
                <p style={{ color: '#666', marginBottom: '4px' }}>Tahmini Süre</p>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  {Math.round(todayProgram.total_duration / 60)} saat
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push(`/yks/tyt/gunluk-program`)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Programa Başla →
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#f0f8ff',
          border: '1px solid #cce5ff',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#0066cc', fontWeight: 600, marginBottom: '4px' }}>Türkçe İlerleme</p>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '45%',
              height: '100%',
              backgroundColor: '#0066cc'
            }} />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>45% tamamlandı</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#fff0f0',
          border: '1px solid #ffcccc',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#cc0000', fontWeight: 600, marginBottom: '4px' }}>Matematik İlerleme</p>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '30%',
              height: '100%',
              backgroundColor: '#cc0000'
            }} />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>30% tamamlandı</p>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: '#f0fff0',
          border: '1px solid #ccffcc',
          borderRadius: '8px'
        }}>
          <p style={{ color: '#00aa00', fontWeight: 600, marginBottom: '4px' }}>Fen İlerleme</p>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '52%',
              height: '100%',
              backgroundColor: '#00aa00'
            }} />
          </div>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>52% tamamlandı</p>
        </div>
      </div>
    </div>
  )
}
