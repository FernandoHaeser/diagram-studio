import type { ComponentPropsWithRef } from 'react';
import { textInputStyles as s } from './styles';

interface TextInputProps extends ComponentPropsWithRef<'input'> {
  mono?: boolean;
}

export function TextInput({ mono, className = '', ...rest }: TextInputProps) {
  return <input type="text" className={`${s.base} ${mono ? s.mono : ''} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }: ComponentPropsWithRef<'textarea'>) {
  return <textarea className={`${s.base} ${s.area} ${className}`} {...rest} />;
}
