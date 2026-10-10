import type { NextApiRequest, NextApiResponse } from 'next'

interface SolveRequest {
  question: string
  subject: 'turkce' | 'matematik' | 'fen'
  level: 'tyt' | 'ayt'
}

interface SolveResponse {
  solution: string
  error_types: string[]
  hints: string[]
  correct_answer: string
}

type ResponseData = SolveResponse | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, subject, level } = req.body as SolveRequest

    if (!question || !subject || !level) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // TODO: Integrate with Google Gemini API
    // For now, return mock response
    const mockResponse: SolveResponse = {
      solution: `Bu soru ${subject.charAt(0).toUpperCase() + subject.slice(1)} dersinin bir problemidir. Çözüm adımları şunlardır:\n\n1. Soruyu dikkatlice okuyun\n2. Gerekli formülleri belirleyin\n3. Adım adım çözün\n4. Cevabı kontrol edin`,
      error_types: ['concentration_error'],
      hints: [
        'Verilen bilgileri dikkatlice okuyun',
        'İlgili formülü bulun',
        'Adım adım ilerleyin'
      ],
      correct_answer: 'XXXXX'
    }

    res.status(200).json(mockResponse)
  } catch (error) {
    console.error('AI solve error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
