export const landingStyles = {
  root: 'min-h-full bg-paper text-ink',
  wrap: 'mx-auto w-full max-w-[1080px] px-6',

  nav: 'flex items-center justify-between py-5',
  wordmark: 'text-[20px] font-semibold tracking-tight',
  navRight: 'flex items-center gap-3',
  navLink: 'text-[13px] text-muted hover:text-ink transition-colors',

  hero: 'grid items-center gap-12 py-16 md:grid-cols-[1.05fr_1fr] md:py-24',
  eyebrow: 'mb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-accent',
  title: 'font-serif text-[52px] leading-[1.02] tracking-tight md:text-[68px]',
  titleEm: 'italic text-accent',
  lead: 'mt-6 max-w-[46ch] text-[16px] leading-relaxed text-muted',
  ctas: 'mt-8 flex flex-wrap items-center gap-3',
  cta: 'inline-flex h-11 items-center gap-2 rounded-md border px-5 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-link',
  ctaPrimary: 'border-ink bg-ink text-paper hover:border-muted hover:bg-muted',
  ctaSecondary: 'border-rule-solid bg-surface text-ink hover:border-ink',
  note: 'mt-4 text-[12px] text-soft',
  stage: 'rounded-xl border border-rule-solid bg-surface p-4 shadow-[0_1px_0_var(--color-rule)]',

  section: 'border-t border-rule py-16',
  sectionTitle: 'font-serif text-[36px] leading-tight tracking-tight',
  sectionText: 'mt-3 max-w-[56ch] text-[14px] leading-relaxed text-muted',
  grid: 'mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3',
  card: 'rounded-lg border border-rule-solid bg-surface p-5',
  cardIcon: 'mb-4 inline-flex h-9 w-9 items-center justify-center rounded-md bg-paper-2 text-ink',
  cardName: 'text-[14px] font-semibold',
  cardDesc: 'mt-1.5 text-[13px] leading-relaxed text-muted',

  features: 'mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2',
  feature: 'flex gap-4',
  featureIcon: 'mt-0.5 shrink-0 text-accent',
  featureName: 'text-[14px] font-semibold',
  featureDesc: 'mt-1 text-[13px] leading-relaxed text-muted',

  closing: 'border-t border-rule py-20 text-center',
  closingTitle: 'font-serif text-[44px] leading-tight tracking-tight',
  closingCtas: 'mt-8 flex justify-center',

  footer: 'flex flex-wrap items-center justify-between gap-2 border-t border-rule py-6 text-[12px] text-soft',
  footerLink: 'hover:text-ink transition-colors',
} as const;
