import type { ReactNode } from 'react';
import { fieldStyles as s } from './styles';

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className={s.root}>
      <span className={s.label}>{label}</span>
      {children}
    </label>
  );
}
