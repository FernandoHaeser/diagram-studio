import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppShell } from '@/components';
import { preloadFonts } from '@/lib/fonts';
import { seedIfEmpty, useStore } from '@/lib/store';

seedIfEmpty();
void preloadFonts().then(() => useStore.getState().bumpFonts());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
);
