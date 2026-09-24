import { toggleStyles as s } from './styles';

interface ToggleProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function Toggle({ checked, label, onChange }: ToggleProps) {
  return (
    <label className={s.root}>
      <input type="checkbox" className={s.box} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
