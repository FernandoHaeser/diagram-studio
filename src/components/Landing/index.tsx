import { specList } from '@/diagrams';
import { HeroDiagram } from '../HeroDiagram';
import { Icon, type IconName } from '../Icon';
import { landingStyles as s } from './styles';

const REPO = 'https://github.com/FernandoHaeser/diagram-studio';

const features: { icon: IconName; name: string; desc: string }[] = [
  { icon: 'plus', name: 'Começa em branco', desc: 'Sem projetos prontos no caminho. Você escolhe o tipo e monta o diagrama do zero.' },
  { icon: 'file', name: 'Salvo no navegador', desc: 'Sem conta, sem servidor. Seus diagramas ficam no seu navegador e não saem da sua máquina.' },
  { icon: 'download', name: 'Exporta como quiser', desc: 'PNG para documentos, SVG para edição e JSON para guardar o projeto inteiro.' },
  { icon: 'upload', name: 'Importa de volta', desc: 'Reabra um SVG ou JSON exportado e continue de onde parou, sem perder nada.' },
];

export function Landing() {
  return (
    <div className={s.root}>
      <div className={s.wrap}>
        <header className={s.nav}>
          <span className={s.wordmark}>digstdio</span>
          <a className={s.navLink} href="#/app">
            Abrir o editor
          </a>
        </header>

        <section className={s.hero}>
          <div>
            <p className={s.eyebrow}>Documentação de software</p>
            <h1 className={s.title}>
              Diagramas de software, <span className={s.titleEm}>sem cerimônia.</span>
            </h1>
            <p className={s.lead}>
              Arquitetura, classes, sequência, ER e casos de uso em um editor direto ao ponto. Abra, desenhe, exporte. Nada de cadastro nem instalação.
            </p>
            <div className={s.ctas}>
              <a className={`${s.cta} ${s.ctaPrimary}`} href="#/app">
                Abrir o editor
                <Icon name="chevron-down" size={14} className="-rotate-90" />
              </a>
              <a className={`${s.cta} ${s.ctaSecondary}`} href={REPO} target="_blank" rel="noreferrer">
                <Icon name="code" size={14} />
                Ver no GitHub
              </a>
            </div>
            <p className={s.note}>Gratuito e roda 100% no navegador.</p>
          </div>
          <div className={s.stage}>
            <HeroDiagram />
          </div>
        </section>

        <section className={s.section} aria-labelledby="tipos">
          <h2 id="tipos" className={s.sectionTitle}>
            Seis tipos de diagrama
          </h2>
          <p className={s.sectionText}>Cada tipo traz as peças e relações certas para o que você quer documentar.</p>
          <div className={s.grid}>
            {specList.map((spec) => (
              <article key={spec.type} className={s.card}>
                <span className={s.cardIcon}>
                  <Icon name={spec.icon} size={20} />
                </span>
                <h3 className={s.cardName}>{spec.label}</h3>
                <p className={s.cardDesc}>{spec.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={s.section} aria-labelledby="como">
          <h2 id="como" className={s.sectionTitle}>
            Feito para não atrapalhar
          </h2>
          <div className={s.features}>
            {features.map((f) => (
              <div key={f.name} className={s.feature}>
                <Icon name={f.icon} size={20} className={s.featureIcon} />
                <div>
                  <h3 className={s.featureName}>{f.name}</h3>
                  <p className={s.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={s.closing}>
          <h2 className={s.closingTitle}>Pronto para o primeiro traço?</h2>
          <div className={s.closingCtas}>
            <a className={`${s.cta} ${s.ctaPrimary}`} href="#/app">
              Abrir o editor
            </a>
          </div>
        </section>

        <footer className={s.footer}>
          <span>digstdio</span>
          <a className={s.footerLink} href={REPO} target="_blank" rel="noreferrer">
            Código no GitHub
          </a>
        </footer>
      </div>
    </div>
  );
}
