import { useTheme } from '@/lib/theme';
import { IconButton } from '../IconButton';
import { themeToggleStyles as s } from './styles';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useTheme((t) => t.theme);
  const toggle = useTheme((t) => t.toggle);
  const dark = theme === 'dark';
  return <IconButton icon={dark ? 'sun' : 'moon'} label={dark ? 'Tema claro' : 'Tema escuro'} className={`${s.root} ${className}`} onClick={toggle} />;
}
