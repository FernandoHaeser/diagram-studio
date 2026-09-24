import type { SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon';
import { selectInputStyles as s } from './styles';

interface Option {
  value: string;
  label: string;
}

interface SelectInputProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: Option[];
  onChange: (value: string) => void;
}

export function SelectInput({ options, onChange, className = '', ...rest }: SelectInputProps) {
  return (
    <div className={s.wrap}>
      <select className={`${s.base} ${className}`} onChange={(e) => onChange(e.target.value)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevron-down" size={14} className={s.chevron} />
    </div>
  );
}
