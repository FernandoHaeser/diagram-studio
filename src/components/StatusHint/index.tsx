import { hintStyles as s } from './styles';

interface StatusHintProps {
  text: string;
  warn?: boolean;
}

export function StatusHint({ text, warn }: StatusHintProps) {
  return (
    <div className={`${s.root} ${warn ? s.warn : s.info}`} role="status">
      {text}
    </div>
  );
}
