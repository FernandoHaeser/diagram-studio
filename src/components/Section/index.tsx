import type { ReactNode } from 'react';
import { sectionStyles as s } from './styles';

interface SectionProps {
  title: string;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className={s.root}>
      <h3 className={s.title}>{title}</h3>
      {children}
    </section>
  );
}
