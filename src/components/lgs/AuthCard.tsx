import Link from 'next/link';

/** Giriş ve kayıt formlarının ortak çerçevesi. */
export function AuthCard({
  title,
  intro,
  children,
  footer,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-12 sm:py-16">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      {intro && <p className="mt-2 text-lgs-soft leading-relaxed">{intro}</p>}
      <div className="mt-8 rounded-2xl border border-lgs-line bg-lgs-surface p-6">{children}</div>
      {footer && <div className="mt-6 text-sm text-lgs-soft">{footer}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-lgs-ink">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && <span className="mt-1 block text-xs text-lgs-soft">{hint}</span>}
    </label>
  );
}

export const inputClass = 'lgs-input w-full rounded-xl px-3.5 py-2.5 text-base';

export const primaryButtonClass =
  'w-full rounded-full bg-lgs-accent px-5 py-3 font-semibold text-lgs-on-accent hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed';

export function FormMessage({ tone, children }: { tone: 'error' | 'info'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-3.5 py-2.5 text-sm ${
        tone === 'error' ? 'border-lgs-bad text-lgs-bad' : 'border-lgs-line text-lgs-ink'
      }`}
    >
      {children}
    </p>
  );
}

export function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-lgs-mark underline underline-offset-2 hover:opacity-80">
      {children}
    </Link>
  );
}
