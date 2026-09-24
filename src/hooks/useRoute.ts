import { useEffect, useState } from 'react';

export type Route = 'home' | 'app';

const read = (): Route => (window.location.hash.startsWith('#/app') ? 'app' : 'home');

/** Roteamento por hash: o GitHub Pages não tem fallback de SPA, então `/#/app` evita 404 ao recarregar. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
