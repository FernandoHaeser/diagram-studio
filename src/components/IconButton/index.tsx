import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon';
import { iconButtonStyles as s } from './styles';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'title'> {
  icon: IconName;
  label: string;
  active?: boolean;
  danger?: boolean;
}

export function IconButton({ icon, label, active, danger, className = '', ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`${s.base} ${active ? s.active : ''} ${danger ? s.danger : ''} ${className}`}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
