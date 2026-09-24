import { useRoute } from '@/hooks/useRoute';
import { AppShell } from '../AppShell';
import { Landing } from '../Landing';
import { routerStyles as s } from './styles';

export function Router() {
  const route = useRoute();
  if (route === 'app') return <AppShell />;
  return (
    <div className={s.scroll}>
      <Landing />
    </div>
  );
}
