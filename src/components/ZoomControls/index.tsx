import { IconButton } from '../IconButton';
import { zoomStyles as s } from './styles';

interface ZoomControlsProps {
  zoom: number;
  onIn: () => void;
  onOut: () => void;
  onFit: () => void;
}

export function ZoomControls({ zoom, onIn, onOut, onFit }: ZoomControlsProps) {
  return (
    <div className={s.root}>
      <IconButton icon="minus" label="Diminuir zoom (-)" onClick={onOut} />
      <span className={s.value}>{Math.round(zoom * 100)}%</span>
      <IconButton icon="plus" label="Aumentar zoom (+)" onClick={onIn} />
      <IconButton icon="fit" label="Ajustar à tela (0)" onClick={onFit} />
    </div>
  );
}
