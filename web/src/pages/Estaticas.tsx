// Home, Methodology e Authors: o mesmo conteúdo do app original, reorganizado.
import type { CSSProperties } from 'react';
import { ANO_MAX, INDEX_COLORS, INDEX_SHORT, carregarDados, type Indice } from '../../shared/dados';
import { Icone, type NomeIcone } from '../components/OptionMenu';
import { Button, Painel } from '../components/st';
import type { Pagina } from '../App';

const DIMENSOES: [Indice, string][] = [
  ['indice_socio_cultural', 'Social cohesion, education, cultural factors'],
  ['indice_mercados_negocios', 'Market efficiency, business environment'],
  ['indice_empreendedorismo', 'Innovation capacity, startup ecosystem'],
  ['indice_eficiencia_governo', 'Public sector effectiveness, regulatory quality'],
  ['indice_ambiente_juridico', 'Legal framework, property rights, judicial system'],
];

const SECOES: [Pagina, NomeIcone, string][] = [
  ['Dashboard', 'bar-chart-line', 'Interactive visualizations, country comparisons, and trend analysis'],
  ['Methodology', 'file-text', 'Learn about index calculation, data sources, and methodology'],
  ['Authors', 'person-badge', 'Meet the research team behind this project'],
  ['Data Download', 'download', 'Download data in CSV or Excel format'],
];

/** Os dez maiores índices totais no ano mais recente; cada linha abre o país no Dashboard. */
function Lideres({ abrirPais }: { abrirPais: (p: string) => void }) {
  const lideres = [...carregarDados({ years: [ANO_MAX] })].sort((a, b) => b.indice_total - a.indice_total).slice(0, 10);
  return (
    <Painel
      className="lideres"
      titulo={`Highest total index in ${ANO_MAX}`}
      sub="Score from 0 to 100. Select a country to open it in the dashboard."
    >
      <ol>
        {lideres.map((r, i) => (
          <li key={r.country_name}>
            <button type="button" onClick={() => abrirPais(r.country_name)}>
              <span className="lider-pos">{i + 1}</span>
              <span className="lider-nome">
                <span>{r.country_name}</span>
                <span className="lider-trilha" aria-hidden="true">
                  <span className="lider-barra" style={{ width: `${r.indice_total}%` }} />
                </span>
              </span>
              <span className="lider-valor">{r.indice_total.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ol>
    </Painel>
  );
}

export function Home({ irPara, abrirPais }: { irPara: (p: Pagina) => void; abrirPais: (p: string) => void }) {
  return (
    <>
      <div className="home-topo">
        <section className="painel apresentacao">
          <h1>Welcome to the Institutional Complexity Index Dashboard</h1>
          <p>
            The Institutional Complexity Index (ICI) is a composite measure that evaluates the quality and efficiency of
            institutional frameworks across different countries. This interactive platform provides comprehensive
            analysis and visualization tools for exploring institutional quality metrics across countries worldwide.
          </p>
          <p>This dashboard allows you to:</p>
          <ul>
            <li>
              <strong>Explore</strong> institutional quality metrics for 100+ countries
            </li>
            <li>
              <strong>Compare</strong> multiple countries side-by-side
            </li>
            <li>
              <strong>Analyze</strong> trends over time (2015-2023)
            </li>
            <li>
              <strong>Download</strong> data for your own research
            </li>
          </ul>
          <div className="acoes">
            <Button onClick={() => irPara('Dashboard')}>Open the dashboard</Button>
            <Button variante="secundario" onClick={() => irPara('Methodology')}>
              Read the methodology
            </Button>
          </div>
        </section>
        <Lideres abrirPais={abrirPais} />
      </div>

      <Painel
        titulo="Five key dimensions"
        sub="Each one is scored from 0 to 100 and keeps its color across every chart."
      >
        <div className="dimensoes">
          {DIMENSOES.map(([indice, descricao]) => (
            <div key={indice} className="dimensao" style={{ '--cor': INDEX_COLORS[indice] } as CSSProperties}>
              <p className="dimensao-nome">
                <span className="barra-cor" style={{ background: INDEX_COLORS[indice] }} />
                {INDEX_SHORT[indice]}
              </p>
              <p>{descricao}</p>
            </div>
          ))}
        </div>
      </Painel>

      <Painel
        titulo="How to navigate"
        sub="Use the navigation menu at the top of the page to explore different sections:"
      >
        <div className="secoes painel-secoes">
          {SECOES.map(([pagina, icone, texto]) => (
            <button key={pagina} type="button" className="secao" onClick={() => irPara(pagina)}>
              <Icone nome={icone} />
              <span>
                <strong>{pagina}</strong>
                <span>{texto}</span>
              </span>
            </button>
          ))}
        </div>
      </Painel>

      <Painel titulo="Getting started">
        <ol className="passos">
          <li>
            <span>
              <strong>Click on "Dashboard"</strong> in the navigation menu at the top of the page
            </span>
          </li>
          <li>
            <span>
              <strong>Select a country</strong> from the sidebar dropdown
            </span>
          </li>
          <li>
            <span>
              <strong>Explore the visualizations</strong> - switch between different chart types
            </span>
          </li>
          <li>
            <span>
              <strong>Compare countries</strong> by selecting additional countries in the sidebar
            </span>
          </li>
          <li>
            <span>
              <strong>Adjust the year range</strong> to focus on specific time periods
            </span>
          </li>
        </ol>
      </Painel>
    </>
  );
}

const COMPONENTES: [Indice, string, string][] = [
  [
    'indice_socio_cultural',
    'Measures social cohesion, cultural diversity, and educational attainment',
    'Literacy rates, social trust, cultural openness',
  ],
  [
    'indice_mercados_negocios',
    'Evaluates market efficiency, business environment, and economic openness',
    'Ease of doing business, market competition, trade openness',
  ],
  [
    'indice_empreendedorismo',
    'Assesses entrepreneurial activity, innovation capacity, and startup ecosystem',
    'Startup rates, R&D investment, innovation output',
  ],
  [
    'indice_eficiencia_governo',
    'Measures public sector effectiveness, regulatory quality, and rule of law',
    'Government effectiveness, regulatory efficiency, corruption control',
  ],
  [
    'indice_ambiente_juridico',
    'Evaluates legal framework quality, property rights, and judicial independence',
    'Contract enforcement, property rights protection, judicial efficiency',
  ],
];

export function Methodology() {
  return (
    <>
      <div>
        <h1 className="pagina-titulo">Methodology &amp; data sources</h1>
        <p className="pagina-intro">
          The Institutional Complexity Index is a comprehensive measure designed to assess the quality and efficiency of
          institutional frameworks across countries. The total index comprises five key dimensions.
        </p>
      </div>
      <Painel titulo="Index components">
        <div>
          {COMPONENTES.map(([indice, mede, indicadores]) => (
            <div key={indice} className="componente" style={{ '--cor': INDEX_COLORS[indice] } as CSSProperties}>
              <span className="barra-cor" style={{ background: INDEX_COLORS[indice] }} />
              <p className="componente-nome">{INDEX_SHORT[indice]} Index</p>
              <div>
                <small>What it measures</small>
                <p>{mede}</p>
              </div>
              <div>
                <small>Key indicators</small>
                <p>{indicadores}</p>
              </div>
              <span className="peso" title="Weight in the total index">
                20%
              </span>
            </div>
          ))}
        </div>
      </Painel>
      <div className="colunas-3">
        <Painel titulo="Calculation methodology">
          <div className="painel-corpo-texto">
            <ul className="lista">
              <li>Each index ranges from 0 to 100, where higher values indicate better institutional quality</li>
              <li>The Total Complexity Index is calculated as the weighted average of all five components</li>
              <li>All indicators are normalized and standardized for cross-country comparability</li>
              <li>Data is updated annually</li>
            </ul>
          </div>
        </Painel>
        <Painel titulo="Data sources">
          <div className="painel-corpo-texto">
            <ul className="lista">
              <li>World Bank: Governance Indicators, Doing Business Reports</li>
              <li>World Economic Forum: Global Competitiveness Reports</li>
              <li>United Nations: Human Development Index</li>
              <li>Heritage Foundation: Economic Freedom Index</li>
              <li>Transparency International: Corruption Perceptions Index</li>
              <li>National Statistical Offices: Country-specific data</li>
            </ul>
          </div>
        </Painel>
        <Painel titulo="Reference period">
          <div className="painel-corpo-texto">
            <ul className="lista">
              <li>Data coverage: 2015 - 2023</li>
              <li>Annual updates</li>
              <li>Historical comparisons available</li>
            </ul>
          </div>
        </Painel>
      </div>
    </>
  );
}

type Autor = {
  nome: string;
  cargo: string;
  interesses: string;
  formacao: string[];
  publicacoes: number;
};

const AUTORES: Autor[] = [
  {
    nome: 'Dr. [Author Name 1]',
    cargo: 'Senior Research Fellow | Professor of Economics',
    interesses: 'Institutional Economics, Economic Development, Governance',
    formacao: [
      'Ph.D. in Economics, [University], [Year]',
      'M.A. in Development Studies, [University], [Year]',
      'B.A. in Economics, [University], [Year]',
    ],
    publicacoes: 3,
  },
  {
    nome: 'Dr. [Author Name 2]',
    cargo: 'Research Associate | Data Scientist',
    interesses: 'Quantitative Methods, Data Analysis, Institutional Quality',
    formacao: [
      'Ph.D. in Statistics, [University], [Year]',
      'M.Sc. in Data Science, [University], [Year]',
      'B.Sc. in Mathematics, [University], [Year]',
    ],
    publicacoes: 3,
  },
  {
    nome: '[Author Name 3]',
    cargo: 'Research Analyst | Policy Specialist',
    interesses: 'Public Policy, Comparative Politics, Institutional Analysis',
    formacao: ['M.A. in Public Policy, [University], [Year]', 'B.A. in Political Science, [University], [Year]'],
    publicacoes: 2,
  },
];

// Cada avatar numa cor das dimensões, só para distinguir os cartões.
const INDICES_AUTORES: Indice[] = ['indice_socio_cultural', 'indice_empreendedorismo', 'indice_eficiencia_governo'];

const iniciais = (nome: string) =>
  nome
    .replace(/^Dr\.\s*/, '')
    .replace(/[[\]]/g, '')
    .split(/\s+/)
    .filter((p) => /^[A-Za-z]/.test(p))
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export function Authors() {
  return (
    <>
      <div>
        <h1 className="pagina-titulo">About the authors</h1>
        <p className="pagina-intro">
          This dashboard was developed by a team of researchers specializing in institutional economics, development
          studies, and data science.
        </p>
      </div>
      <div className="autores">
        {AUTORES.map((autor, i) => (
          <article key={autor.nome} className="painel autor" style={{ '--cor': INDEX_COLORS[INDICES_AUTORES[i]] } as CSSProperties}>
            <div className="autor-cabeca">
              <span className="avatar" aria-hidden="true">
                {iniciais(autor.nome)}
              </span>
              <div>
                <h2 className="autor-nome">{autor.nome}</h2>
                <p className="autor-cargo">{autor.cargo}</p>
              </div>
            </div>
            <dl>
              <div>
                <dt>Institution</dt>
                <dd>[University/Research Center]</dd>
              </div>
              <div>
                <dt>Research interests</dt>
                <dd>{autor.interesses}</dd>
              </div>
              <div>
                <dt>Education</dt>
                <dd>
                  <ul>
                    {autor.formacao.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Selected publications</dt>
                <dd>
                  <ul>
                    {Array.from({ length: autor.publicacoes }, (_, n) => (
                      <li key={n}>Paper {n + 1} (Journal, Year)</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <p className="autor-contato">
              <a href="mailto:email@university.edu">email@university.edu</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </p>
          </article>
        ))}
      </div>
    </>
  );
}
