/** Supabase Auth hata mesajlarını kullanıcının anlayacağı Türkçeye çevirir. */
export function authErrorMessage(message: string | undefined): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (m.includes('email not confirmed'))
    return 'E-posta adresin henüz onaylanmadı. Gelen kutuna gönderdiğimiz bağlantıya tıkla.';
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.';
  if (m.includes('password') && (m.includes('at least') || m.includes('weak') || m.includes('short')))
    return 'Şifre en az 8 karakter olmalı. Harf ve rakamı birlikte kullan.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Kısa sürede çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.';
  if (m.includes('invalid') && m.includes('email')) return 'E-posta adresini kontrol et.';
  if (m.includes('fetch') || m.includes('network'))
    return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.';
  return 'Bir sorun oluştu. Tekrar dene; sürerse bize bildir.';
}
