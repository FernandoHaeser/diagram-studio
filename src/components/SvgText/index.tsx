import type { ReactNode } from 'react';
import { C, F, type FontKey } from '@/lib/tokens';
import { svgTextStyles as s } from './styles';

interface SvgTextProps {
  x: number;
  y: number;
  children: ReactNode;
  size?: number;
  weight?: number;
  fill?: string;
  family?: FontKey;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
  underline?: boolean;
  spacing?: string;
}

export function SvgText({
  x,
  y,
  children,
  size = s.defaultSize,
  weight = 400,
  fill = C.ink,
  family = s.defaultFamily,
  anchor = 'middle',
  italic,
  underline,
  spacing,
}: SvgTextProps) {
  return (
    <text
      x={x}
      y={y}
      fill={fill}
      fontSize={size}
      fontWeight={weight}
      fontFamily={F[family]}
      fontStyle={italic ? 'italic' : undefined}
      textDecoration={underline ? 'underline' : undefined}
      textAnchor={anchor}
      letterSpacing={spacing}
      pointerEvents="none"
    >
      {children}
    </text>
  );
}
