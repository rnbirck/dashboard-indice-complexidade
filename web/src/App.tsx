// Estrutura do app original: cabeçalho com as seis páginas, filtros na lateral e rodapé.
import { useEffect, useState } from 'react';
import { ANO_MAX, ANO_MIN, INDEX_COLORS, INDICES, PAISES } from '../shared/dados';
import { MAX_COMPARACAO } from './lib/tema';
import { Nav } from './components/OptionMenu';
import { Sidebar, type Filtros } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Authors, Home, Methodology } from './pages/Estaticas';
import { Contact, Download } from './pages/Formularios';

const PAGINAS = [
  { valor: 'Home', icone: 'house-door' },
  { valor: 'Dashboard', icone: 'bar-chart-line' },
  { valor: 'Methodology', icone: 'file-text' },
  { valor: 'Authors', icone: 'person-badge' },
  { valor: 'Contact Us', icone: 'envelope' },
  { valor: 'Data Download', icone: 'download' },
] as const;
export type Pagina = (typeof PAGINAS)[number]['valor'];

// As cinco dimensões formam o pentágono da marca, cada fatia na cor usada nos gráficos.
const FATIAS = [
  'M13 13L13 1L24.41 9.29Z',
  'M13 13L24.41 9.29L20.05 22.71Z',
  'M13 13L20.05 22.71L5.95 22.71Z',
  'M13 13L5.95 22.71L1.59 9.29Z',
  'M13 13L1.59 9.29L13 1Z',
];

const Marca = () => (
  <svg viewBox="0 0 26 26" aria-hidden="true">
    {FATIAS.map((d, i) => (
      <path key={d} d={d} fill={INDEX_COLORS[INDICES[i]]} stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
    ))}
  </svg>
);

// Só no celular a lateral cobre a página; ali ela começa fechada e fecha ao trocar de página.
const celular = () => window.matchMedia('(max-width: 640px)').matches;

// Página e filtros ficam na URL (?page=Dashboard&country=Brazil&compare=Chile,Germany&years=2015-2023),
// para o link abrir a mesma visão.
function lerUrl(): { pagina: Pagina; filtros: Filtros } {
  const q = new URLSearchParams(window.location.search);
  const pagina = PAGINAS.find((p) => p.valor === q.get('page'))?.valor ?? 'Home';
  const pais = PAISES.includes(q.get('country') ?? '') ? q.get('country') : null;
  const comparacao = (q.get('compare') ?? '')
    .split(',')
    .filter((c, i, todos) => PAISES.includes(c) && c !== pais && todos.indexOf(c) === i)
    .slice(0, MAX_COMPARACAO);
  const [a, b] = (q.get('years') ?? '').split('-').map(Number);
  const anos: [number, number] =
    a >= ANO_MIN && b <= ANO_MAX && a <= b ? [a, b] : [ANO_MIN, ANO_MAX];
  return { pagina, filtros: { pais, comparacao, anos } };
}

function gravarUrl(pagina: Pagina, f: Filtros) {
  const q = new URLSearchParams();
  if (pagina !== 'Home') q.set('page', pagina);
  if (f.pais) q.set('country', f.pais);
  if (f.comparacao.length) q.set('compare', f.comparacao.join(','));
  if (f.anos[0] !== ANO_MIN || f.anos[1] !== ANO_MAX) q.set('years', f.anos.join('-'));
  const busca = q.toString();
  window.history.replaceState(null, '', busca ? `?${busca}` : window.location.pathname);
}

export function App() {
  const [inicial] = useState(lerUrl);
  const [pagina, setPagina] = useState<Pagina>(inicial.pagina);
  const [filtros, setFiltros] = useState<Filtros>(inicial.filtros);
  // Aberta por padrão, como no original (initial_sidebar_state="expanded").
  const [lateralAberta, setLateralAberta] = useState(() => !celular());

  useEffect(() => {
    window.scrollTo(0, 0);
    if (celular()) setLateralAberta(false);
  }, [pagina]);

  useEffect(() => gravarUrl(pagina, filtros), [pagina, filtros]);

  // Baixa o ECharts em segundo plano para o Dashboard abrir sem espera.
  useEffect(() => {
    const id = setTimeout(() => void import('./lib/echarts'), 1200);
    return () => clearTimeout(id);
  }, []);

  function abrirPais(pais: string) {
    setFiltros((f) => ({ ...f, pais, comparacao: f.comparacao.filter((c) => c !== pais) }));
    setPagina('Dashboard');
  }

  return (
    <div className={lateralAberta ? undefined : 'lateral-fechada'}>
      <header className="topo">
        <button
          className="botao-lateral"
          aria-label={lateralAberta ? 'Hide filters' : 'Show filters'}
          aria-expanded={lateralAberta}
          aria-controls="filtros"
          onClick={() => setLateralAberta((a) => !a)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M3 6h18v2H3zm0 5h12v2H3zm0 5h18v2H3z" />
          </svg>
        </button>
        <div className="marca">
          <Marca />
          <span className="marca-texto">Institutional Complexity Index</span>
        </div>
        <Nav opcoes={PAGINAS} valor={pagina} onChange={setPagina} />
      </header>
      <div className="corpo">
        <aside id="filtros" className="lateral" aria-label="Filters" inert={!lateralAberta}>
          <Sidebar filtros={filtros} onChange={setFiltros} />
        </aside>
        <main className="conteudo">
          <div className="conteudo-interno">
            {pagina === 'Home' && <Home irPara={setPagina} abrirPais={abrirPais} />}
            {pagina === 'Dashboard' && <Dashboard filtros={filtros} abrirFiltros={() => setLateralAberta(true)} />}
            {pagina === 'Methodology' && <Methodology />}
            {pagina === 'Authors' && <Authors />}
            {pagina === 'Contact Us' && <Contact />}
            {pagina === 'Data Download' && <Download />}
          </div>
          <footer className="rodape">Institutional Complexity Index Dashboard</footer>
        </main>
      </div>
    </div>
  );
}
