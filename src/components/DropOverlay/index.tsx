import { dropStyles as s } from './styles';

export function DropOverlay() {
  return (
    <div className={s.root} role="presentation">
      <div>
        <p className={s.text}>Solte para importar</p>
        <p className={s.hint}>.html ou .svg do /diagram-design, SVG do Diagram Studio ou projeto .json</p>
      </div>
    </div>
  );
}
