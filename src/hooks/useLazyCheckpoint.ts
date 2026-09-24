import { useRef } from 'react';
import { useStore } from '@/lib/store';

/**
 * Guarda um ponto de desfazer só quando o usuário realmente altera o campo:
 * `arm` no foco, `commit` na primeira mudança. Assim, focar e sair não cria passos vazios.
 */
export function useLazyCheckpoint() {
  const armed = useRef(false);
  return {
    arm: () => {
      armed.current = true;
    },
    commit: () => {
      if (!armed.current) return;
      armed.current = false;
      useStore.getState().checkpoint();
    },
    now: () => useStore.getState().checkpoint(),
  };
}
