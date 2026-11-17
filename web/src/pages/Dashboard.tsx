// Dashboard: perfil do país (posições entre todos), evolução, comparação e radar.
// Mesmos dados e regras do app original (ranking = rank(ascending=False, method="min")).
import { useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react';
import {
  INDEX_COLORS,
  INDEX_LABELS,
  INDEX_SHORT,
  INDICES,
  PAISES,
  carregarDados,
  intervaloAnos,
  posicao,
  type Indice,
  type Registro,
} from '../../shared/dados';
import { EChart, type Instancia } from '../components/EChart';
import { Icone } from '../components/OptionMenu';
import { Selectbox } from '../components/Select';
import { corPais, type Filtros } from '../components/Sidebar';
import { Alert, Button, Painel, Segmented } from '../components/st';
import { APAGADO, BASE, EIXO, EIXO_X_ANOS, EIXO_Y_VALOR, TINTA, TINTA_2, GRADE, rgba } from '../lib/tema';

const ABAS = ['Index Evolution', 'Country Comparison', 'Radar Chart'] as const;
type Aba = (typeof ABAS)[number];
const ICONES_ABAS = { 'Index Evolution': 'graph-up', 'Country Comparison': 'globe', 'Radar Chart': 'pentagon' } as const;

const VISTAS = ['Chart', 'Table'] as const;
type Vista = (typeof VISTAS)[number];

const DIMENSOES = INDICES.filter((i) => i !== 'indice_total');
// Nos radares pequenos, uma palavra por eixo para não cortar o nome.
const RADAR_CURTO: Record<Indice, string> = {
  indice_socio_cultural: 'Socio-Cultural',
  indice_mercados_negocios: 'Markets',
  indice_empreendedorismo: 'Entrepreneurship',
  indice_eficiencia_governo: 'Government',
  indice_ambiente_juridico: 'Legal',
  indice_total: 'Total',
};
// Tela de celular: o radar sobreposto usa nomes curtos nos eixos para não cortá-los.
const CELULAR = '(max-width: 640px)';
const useCelular = () =>
  useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CELULAR);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(CELULAR).matches,
  );

const f2 = (v: number) => v.toFixed(2);
const f1 = (v: number) => v.toFixed(1);
// Seis casas, como nas dicas do app original (hovertemplate "%{y:.6f}").
const f6 = (v: number) => v.toFixed(6);

function ordinal(n: number): string {
  const resto = n % 100;
  if (resto >= 11 && resto <= 13) return `${n}th`;
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`;
}

export function Dashboard({ filtros, abrirFiltros, escolherPais }: {
  filtros: Filtros;
  abrirFiltros: () => void;
  escolherPais: (pais: string) => void;
}) {
  const { pais, comparacao, anos } = filtros;
  const [aba, setAba] = useState<Aba>('Index Evolution');

  const dados = useMemo(() => {
    if (!pais) return null;
    const principal = carregarDados({ countries: [pais] }).filter((r) => r.year >= anos[0] && r.year <= anos[1]);
    const comparados = comparacao.length
      ? carregarDados({ countries: [pais, ...comparacao], years: intervaloAnos(...anos) })
      : principal;
    return { principal, comparados };
  }, [pais, comparacao, anos]);

  if (!pais || !dados) {
    return (
      <div className="painel vazio">
        <p className="vazio-titulo">Choose a country to start</p>
        <p>Pick a main country below. In the filters you can add up to seven more to compare.</p>
        <div className="vazio-escolha">
          <Selectbox
            label="Main country"
            options={PAISES}
            placeholder="Choose a country..."
            value={null}
            onChange={(novo) => novo && escolherPais(novo)}
          />
        </div>
        <Button variante="secundario" onClick={abrirFiltros}>
          Open filters
        </Button>
      </div>
    );
  }
  if (dados.principal.length === 0) {
    return <Alert tipo="warning">No data available for {pais} in the selected year range.</Alert>;
  }

  const paises = [pais, ...comparacao];
  const ultimo = dados.principal[dados.principal.length - 1];
  const cor = (p: string) => corPais(filtros, p);

  return (
    <>
      <div className="pais">
        <div>
          <h1 className="pais-nome">
            {pais} <span className="pais-codigo">{ultimo.country_cod}</span>
          </h1>
          <p className="pais-sub">
            Showing {anos[0]} to {anos[1]}
            {comparacao.length > 0 && <>, compared with {comparacao.join(', ')}</>}.
          </p>
        </div>
        <div className="pais-total">
          <p className="pais-total-valor">{f2(ultimo.indice_total)}</p>
          <p className="pais-total-rotulo">Total complexity index in {ultimo.year}</p>
        </div>
      </div>
      <Posicoes principal={dados.principal} pais={pais} comparacao={comparacao} cor={cor} />
      <Segmented
        label="Visualization"
        options={ABAS}
        value={aba}
        onChange={setAba}
        render={(a) => (
          <>
            <Icone nome={ICONES_ABAS[a]} />
            {a}
          </>
        )}
      />
      {aba === 'Index Evolution' && <Evolucao registros={dados.principal} pais={pais} />}
      {aba === 'Country Comparison' && <Comparacao registros={dados.comparados} paises={paises} cor={cor} />}
      {aba === 'Radar Chart' && <Radar registros={dados.comparados} paises={paises} cor={cor} />}
    </>
  );
}

const SETA_CIMA = 'M12 5l7 8h-5v6h-4v-6H5z';
const SETA_BAIXO = 'M12 19l-7-8h5V5h4v6h5z';

/** Variação de posição: subir no ranking (número menor) é melhora. */
function Variacao({ variacao, anoAnterior }: { variacao: number; anoAnterior: number }) {
  if (variacao === 0) {
    return (
      <span className="variacao variacao-igual" title={`Same position as in ${anoAnterior}`}>
        No change
      </span>
    );
  }
  const subiu = variacao < 0;
  const n = Math.abs(variacao);
  const texto = `${subiu ? 'Up' : 'Down'} ${n} ${n === 1 ? 'place' : 'places'} since ${anoAnterior}`;
  return (
    <span className={`variacao ${subiu ? 'variacao-melhora' : 'variacao-piora'}`} title={texto} aria-label={texto}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d={subiu ? SETA_CIMA : SETA_BAIXO} />
      </svg>
      {subiu ? 'Up' : 'Down'} {n}
    </span>
  );
}

type Dica = { indice: Indice; x: number; direita: boolean; sobre: string | null };

/** A faixa de posições: onde o país está entre todos, em cada dimensão, no último ano. */
function Posicoes({ principal, pais, comparacao, cor }: {
  principal: Registro[];
  pais: string;
  comparacao: string[];
  cor: (p: string) => string;
}) {
  const [dica, setDica] = useState<Dica | null>(null);
  const [realce, setRealce] = useState<string | null>(null);
  const ultimoAno = principal[principal.length - 1].year;
  const todosUltimo = carregarDados({ years: [ultimoAno] });
  const anoAnterior = principal.length > 1 ? principal[principal.length - 2].year : null;
  const todosAnterior = anoAnterior !== null ? carregarDados({ years: [anoAnterior] }) : null;
  const total = todosUltimo.length;
  const fracao = (rank: number) => (rank - 1) / (total - 1);
  const lugar = (rank: number) => `${fracao(rank) * 100}%`;
  const linhaPais = todosUltimo.find((r) => r.country_name === pais)!;
  const ordem: Indice[] = [...DIMENSOES, 'indice_total'];
  const paises = [pais, ...comparacao];
  const valor = (p: string, indice: Indice) => todosUltimo.find((r) => r.country_name === p)![indice];
  const classificar = (indice: Indice) =>
    paises.map((p) => ({ p, rank: posicao(todosUltimo, p, indice) })).sort((a, b) => a.rank - b.rank);

  // A dica abre na hora, onde o ponteiro está, e lista todos os países selecionados.
  function mostrar(indice: Indice, el: HTMLElement, clienteX: number | null) {
    const caixa = el.getBoundingClientRect();
    const x = clienteX === null ? fracao(posicao(todosUltimo, pais, indice)) * caixa.width : clienteX - caixa.left;
    const perto = classificar(indice)
      .map(({ p, rank }) => ({ p, d: Math.abs(fracao(rank) * caixa.width - x) }))
      .sort((a, b) => a.d - b.d)[0];
    setDica({ indice, x, direita: x < caixa.width / 2, sobre: perto && perto.d <= 10 ? perto.p : null });
  }

  return (
    <Painel
      titulo={`Ranking in ${ultimoAno}`}
      sub={
        anoAnterior !== null
          ? `Position among ${total} countries, with the change since ${anoAnterior}. Hover or tap a track to compare the selected countries.`
          : `Position among ${total} countries. Hover or tap a track to compare the selected countries.`
      }
    >
      <ul className="legenda-paises" aria-label="Country colors" onMouseLeave={() => setRealce(null)}>
        {paises.map((p) => (
          <li
            key={p}
            className={`${p === pais ? 'legenda-principal' : ''}${realce && realce !== p ? ' legenda-apagada' : ''}`}
            onMouseEnter={() => setRealce(p)}
          >
            <span className="legenda-ponto" style={{ background: cor(p) }} />
            {p}
          </li>
        ))}
      </ul>
      <div className="posicoes">
        {ordem.map((indice) => {
          const atual = posicao(todosUltimo, pais, indice);
          const outros = comparacao.map((c) => ({ c, rank: posicao(todosUltimo, c, indice) }));
          const apagar = (p: string) => (realce && realce !== p ? ' trilha-apagada' : '');
          const aberta = dica?.indice === indice ? dica : null;
          const marcado = realce ?? aberta?.sobre ?? null;
          const resumo = classificar(indice)
            .map(({ p, rank }) => `${p} ${ordinal(rank)}`)
            .join(', ');
          return (
            <div key={indice} className={`posicao${indice === 'indice_total' ? ' posicao-total' : ''}`}>
              <div className="posicao-nome" style={{ '--cor': INDEX_COLORS[indice] } as CSSProperties}>
                <span className="barra-cor" style={{ background: INDEX_COLORS[indice] }} />
                <span>{INDEX_SHORT[indice]}</span>
              </div>
              <div className="posicao-valor" title={`${INDEX_LABELS[indice]} value`}>
                {f2(linhaPais[indice])}
              </div>
              <div
                className="trilha"
                tabIndex={0}
                aria-label={`${INDEX_LABELS[indice]} ranking: ${resumo}`}
                // No celular o toque também gera mousemove, e a dica fica aberta até tocar em outro lugar.
                onMouseMove={(e) => mostrar(indice, e.currentTarget, e.clientX)}
                onMouseLeave={() => setDica(null)}
                onFocus={(e) => mostrar(indice, e.currentTarget, null)}
                onBlur={() => setDica(null)}
              >
                {[0.25, 0.5, 0.75].map((q) => (
                  <span key={q} className="trilha-quartil" style={{ left: `${q * 100}%` }} />
                ))}
                {outros.map(({ c, rank }) => (
                  <span
                    key={c}
                    className={`trilha-outro${apagar(c)}${marcado === c ? ' trilha-marcada' : ''}`}
                    style={{ left: lugar(rank), background: cor(c) }}
                  />
                ))}
                <span
                  className={`trilha-ponto${apagar(pais)}`}
                  style={{ left: lugar(atual), background: cor(pais) }}
                />
                {realce && (
                  <span className="trilha-rotulo" style={{ left: lugar(posicao(todosUltimo, realce, indice)) }}>
                    {ordinal(posicao(todosUltimo, realce, indice))}
                  </span>
                )}
                {aberta && (
                  <div
                    className={`dica ${aberta.direita ? 'dica-direita' : 'dica-esquerda'}`}
                    style={{ left: aberta.x }}
                    role="tooltip"
                  >
                    <p className="dica-titulo">
                      {INDEX_LABELS[indice]}, {ultimoAno}
                    </p>
                    {classificar(indice).map(({ p, rank }) => (
                      <div
                        key={p}
                        className={`dica-linha${p === pais ? ' dica-principal' : ''}${p === aberta.sobre ? ' dica-ativa' : ''}`}
                      >
                        <span className="ponto-cor" style={{ background: cor(p) }} />
                        <span className="dica-nome">{p}</span>
                        <span className="dica-valor">{f2(valor(p, indice))}</span>
                        <strong>{ordinal(rank)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="posicao-rank">
                <strong>{ordinal(atual)}</strong> <span>of {total}</span>
              </div>
              {todosAnterior && anoAnterior !== null ? (
                <Variacao variacao={atual - posicao(todosAnterior, pais, indice)} anoAnterior={anoAnterior} />
              ) : (
                <span />
              )}
            </div>
          );
        })}
        <div className="trilha-escala" aria-hidden="true">
          <div>
            <span>1st</span>
            <span>{ordinal(total)}</span>
          </div>
        </div>
      </div>
    </Painel>
  );
}

const ROTULOS = ['Latest', 'Every year'] as const;
type Rotulos = (typeof ROTULOS)[number];

function PainelGrafico({ titulo, sub, extra, vista, setVista, rotulos, setRotulos, children, tabela }: {
  titulo: string;
  sub: string;
  extra?: ReactNode;
  vista: Vista;
  setVista: (v: Vista) => void;
  rotulos?: Rotulos;
  setRotulos?: (r: Rotulos) => void;
  children: ReactNode;
  tabela: ReactNode;
}) {
  return (
    <Painel
      titulo={titulo}
      sub={sub}
      acoes={
        <div className="painel-acoes">
          {rotulos && setRotulos && vista === 'Chart' && (
            <Segmented label="Values shown" options={ROTULOS} value={rotulos} onChange={setRotulos} small />
          )}
          <Segmented label="View" options={VISTAS} value={vista} onChange={setVista} small />
        </div>
      }
    >
      {extra && <div className="painel-cabeca">{extra}</div>}
      {vista === 'Chart' ? <div className="painel-corpo">{children}</div> : <div className="tabela-rolagem">{tabela}</div>}
    </Painel>
  );
}

function Tabela({ cabecalho, linhas }: { cabecalho: ReactNode[]; linhas: (string | number)[][] }) {
  return (
    <table className="tabela">
      <thead>
        <tr>
          {cabecalho.map((c, i) => (
            <th key={i} scope="col">
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={String(l[0])}>
            {l.map((v, i) => (i === 0 ? <th key={i} scope="row">{v}</th> : <td key={i}>{v}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const ComCor = ({ cor, children }: { cor: string; children: ReactNode }) => (
  <span className="th-cor">
    <span className="ponto-cor" style={{ background: cor }} />
    {children}
  </span>
);

const TOOLTIP_EIXO = {
  ...BASE.tooltip,
  trigger: 'axis',
  order: 'valueDesc',
  axisPointer: { type: 'line', lineStyle: { color: EIXO } },
  valueFormatter: (v: number) => f6(v),
};

// Uma linha só, com setas quando não cabe: no celular a legenda não invade o gráfico.
const LEGENDA = {
  type: 'scroll',
  pageIconSize: 10,
  pageTextStyle: { color: TINTA_2, fontSize: 11 },
  top: 0,
  left: 0,
  icon: 'roundRect',
  itemWidth: 14,
  itemHeight: 4,
  itemGap: 16,
  textStyle: { color: TINTA_2, fontSize: 12 },
};

const ROTULO_PONTO = {
  position: 'top',
  distance: 6,
  formatter: (p: { value: number }) => f2(p.value),
  color: TINTA,
  fontSize: 10.5,
  fontWeight: 600,
  textBorderColor: '#fff',
  textBorderWidth: 2.5,
};

/**
 * Uma série de linha. Em "Latest" só o último valor fica rotulado; passar o mouse sobre a
 * linha mostra os valores de todos os anos dela e apaga as outras. Em "Every year" todos os
 * pontos ganham rótulo, e os que colidem são escondidos.
 */
function linha(nome: string, cor: string, valores: (number | null)[], destaque: boolean, fim: string | null, todos: boolean) {
  return {
    type: 'line',
    name: nome,
    data: valores,
    color: cor,
    lineStyle: { width: destaque ? 3 : 2 },
    symbol: 'circle',
    symbolSize: destaque ? 7 : 5,
    itemStyle: { borderColor: '#fff', borderWidth: 1.5 },
    z: destaque ? 3 : 2,
    triggerLineEvent: true,
    label: { ...ROTULO_PONTO, show: todos },
    endLabel: {
      show: !todos && fim !== null,
      formatter: () => fim ?? '',
      color: TINTA_2,
      fontSize: 11.5,
      fontWeight: destaque ? 650 : 500,
      distance: 6,
    },
    emphasis: { focus: 'series', lineStyle: { width: destaque ? 3.5 : 3 }, label: { ...ROTULO_PONTO, show: true } },
    blur: { lineStyle: { opacity: 0.15 }, itemStyle: { opacity: 0.15 }, label: { show: false }, endLabel: { show: false } },
    labelLayout: todos ? { hideOverlap: true } : { moveOverlap: 'shiftY' },
  };
}

/** Passar o mouse numa linha destaca a série inteira: rótulos em todos os anos e as outras apagadas. */
function useFocoSerie() {
  const grafico = useRef<Instancia | null>(null);
  const eventos = {
    mouseover: (e: { seriesName?: string }) =>
      e.seriesName && grafico.current?.dispatchAction({ type: 'highlight', seriesName: e.seriesName }),
    mouseout: (e: { seriesName?: string }) =>
      e.seriesName && grafico.current?.dispatchAction({ type: 'downplay', seriesName: e.seriesName }),
  };
  return { instancia: grafico, eventos };
}

function Evolucao({ registros, pais }: { registros: Registro[]; pais: string }) {
  const [vista, setVista] = useState<Vista>('Chart');
  // Só o último valor rotulado; "Every year" mostra todos os pontos, como no original.
  const [rotulos, setRotulos] = useState<Rotulos>('Latest');
  const anos = registros.map((r) => r.year);
  const foco = useFocoSerie();
  const todos = rotulos === 'Every year';
  const option = useMemo(
    () => ({
      ...BASE,
      legend: LEGENDA,
      tooltip: TOOLTIP_EIXO,
      grid: { left: 8, right: todos ? 20 : 44, top: 44, bottom: 4, containLabel: true },
      xAxis: EIXO_X_ANOS(anos),
      yAxis: EIXO_Y_VALOR,
      // O total vai por último para ficar por cima e ganhar a disputa de rótulos.
      series: [...DIMENSOES, 'indice_total' as const].map((i) => {
        const valores = registros.map((r) => r[i]);
        return linha(INDEX_SHORT[i], INDEX_COLORS[i], valores, i === 'indice_total', f2(valores[valores.length - 1]), todos);
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registros, todos],
  );
  return (
    <PainelGrafico
      titulo={`Index evolution, ${pais}`}
      sub="Score from 0 to 100. Hover a line to see its values for every year; click a legend item to hide it."
      vista={vista}
      setVista={setVista}
      rotulos={rotulos}
      setRotulos={setRotulos}
      tabela={
        <Tabela
          cabecalho={['Year', ...INDICES.map((i) => <ComCor key={i} cor={INDEX_COLORS[i]}>{INDEX_SHORT[i]}</ComCor>)]}
          linhas={registros.map((r) => [r.year, ...INDICES.map((i) => f2(r[i]))])}
        />
      }
    >
      <EChart {...foco} option={option} height={380} label={`Line chart of the five dimensions and the total index for ${pais}`} />
    </PainelGrafico>
  );
}

const OPCOES_COMPARACAO: Indice[] = [
  'indice_total',
  'indice_socio_cultural',
  'indice_mercados_negocios',
  'indice_empreendedorismo',
  'indice_eficiencia_governo',
  'indice_ambiente_juridico',
];

const AVISO_COMPARAR = 'Add countries under "Compare with" in the filters to compare them here.';

function Comparacao({ registros, paises, cor }: { registros: Registro[]; paises: string[]; cor: (p: string) => string }) {
  const [indice, setIndice] = useState<Indice>('indice_total');
  const [vista, setVista] = useState<Vista>('Chart');
  const [rotulos, setRotulos] = useState<Rotulos>('Latest');
  const anos = [...new Set(registros.map((r) => r.year))];
  const foco = useFocoSerie();
  const serie = (p: string) => anos.map((a) => registros.find((r) => r.country_name === p && r.year === a)?.[indice] ?? null);
  const todos = rotulos === 'Every year';
  // Com até quatro países o nome cabe ao lado do último valor; acima disso, só o valor.
  const comNome = paises.length <= 4;

  const option = useMemo(
    () => ({
      ...BASE,
      tooltip: TOOLTIP_EIXO,
      grid: { left: 8, right: todos ? 20 : comNome ? 140 : 44, top: 44, bottom: 4, containLabel: true },
      xAxis: EIXO_X_ANOS(anos),
      yAxis: EIXO_Y_VALOR,
      // O país principal vai por último para ficar por cima das outras linhas.
      series: [...paises.slice(1), paises[0]].map((p) => {
        const valores = serie(p);
        const ultimo = [...valores].reverse().find((v) => v !== null);
        const fim = ultimo == null ? null : comNome ? `${p}  ${f2(ultimo)}` : f2(ultimo);
        return linha(p, cor(p), valores, p === paises[0], fim, todos);
      }),
      // A legenda segue a ordem da seleção, com o principal primeiro.
      legend: { ...LEGENDA, data: paises },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registros, paises, indice, todos],
  );

  return (
    <PainelGrafico
      titulo={`${INDEX_LABELS[indice]} by country`}
      sub={`${paises[0]} in the thicker line. Score from 0 to 100. Hover a line to see its values for every year.`}
      vista={vista}
      setVista={setVista}
      rotulos={rotulos}
      setRotulos={setRotulos}
      extra={
        <Segmented
          label="Index"
          small
          options={OPCOES_COMPARACAO}
          value={indice}
          onChange={setIndice}
          render={(i) => INDEX_SHORT[i]}
        />
      }
      tabela={
        <Tabela
          cabecalho={['Year', ...paises.map((p) => <ComCor key={p} cor={cor(p)}>{p}</ComCor>)]}
          linhas={anos.map((a, n) => [a, ...paises.map((p) => (serie(p)[n] === null ? '' : f2(serie(p)[n]!)))])}
        />
      }
    >
      {paises.length === 1 && <Alert>{AVISO_COMPARAR}</Alert>}
      <EChart {...foco} option={option} height={380} label={`Line chart of ${INDEX_LABELS[indice]} by country`} />
    </PainelGrafico>
  );
}

const MODOS = ['Overlay', 'Side by Side'] as const;
// Cabeçalhos curtos da tabela ao lado do radar; o nome completo fica no title.
const COLUNA_CURTA: Record<Indice, string> = {
  indice_socio_cultural: 'Socio',
  indice_mercados_negocios: 'Market',
  indice_empreendedorismo: 'Entrep.',
  indice_eficiencia_governo: 'Gov.',
  indice_ambiente_juridico: 'Legal',
  indice_total: 'Total',
};
const COLUNAS_RADAR: Indice[] = [...DIMENSOES, 'indice_total'];
// Colunas do lado a lado pelo número de países: 4 vira 2x2 e nenhuma linha fica com um só.
const colunasLado = (n: number) => (n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4);

function Radar({ registros, paises, cor }: { registros: Registro[]; paises: string[]; cor: (p: string) => string }) {
  const anosDisponiveis = useMemo(
    () => [...new Set(registros.map((r) => r.year))].sort((a, b) => b - a).map(String),
    [registros],
  );
  const [anoEscolhido, setAno] = useState<string | null>(null);
  const ano = anoEscolhido && anosDisponiveis.includes(anoEscolhido) ? anoEscolhido : anosDisponiveis[0];
  const [modo, setModo] = useState<(typeof MODOS)[number]>('Overlay');
  const [vista, setVista] = useState<Vista>('Chart');
  // `foco` vem da tabela ao lado e redesenha o radar; `focoGrafico`, do mouse no próprio radar,
  // só marca a linha da tabela (o radar já se destaca sozinho).
  const [foco, setFoco] = useState<string | null>(null);
  const [focoGrafico, setFocoGrafico] = useState<string | null>(null);
  const [ocultos, setOcultos] = useState<string[]>([]);
  const celular = useCelular();

  const linhas = paises
    .map((p) => ({ p, r: registros.find((x) => x.country_name === p && x.year === Number(ano)) }))
    .filter((x): x is { p: string; r: Registro } => x.r !== undefined);
  const visiveis = linhas.filter(({ p }) => !ocultos.includes(p));
  // O principal é desenhado por último: fica por cima e é o que responde ao passar o mouse.
  const desenho = [...visiveis.filter(({ p }) => p !== paises[0]), ...visiveis.filter(({ p }) => p === paises[0])];
  const maiores = Object.fromEntries(COLUNAS_RADAR.map((c) => [c, Math.max(...linhas.map(({ r }) => r[c]))]));

  // A escala de 0 a 100 aparece só no eixo de cima, como o eixo radial do original.
  const radar = (raio: string, fonte: number, curto = false) => ({
    indicator: DIMENSOES.map((d, i) => ({
      name: (curto ? RADAR_CURTO : INDEX_SHORT)[d],
      max: 100,
      ...(i === 0 && {
        axisLabel: { show: true, showMinLabel: false, color: APAGADO, fontSize: curto ? 9.5 : 10.5, margin: 4 },
      }),
    })),
    radius: raio,
    center: ['50%', '52%'],
    clockwise: true,
    splitNumber: 4,
    axisName: { color: TINTA_2, fontSize: fonte, fontWeight: 550 },
    splitLine: { lineStyle: { color: GRADE } },
    splitArea: { show: true, areaStyle: { color: ['#fbfbfc', '#ffffff'] } },
    axisLine: { lineStyle: { color: GRADE } },
  });

  // Casas decimais das dicas como no original: seis no sobreposto, duas no lado a lado.
  const tooltipItem = (formato: (v: number) => string) => ({
    ...BASE.tooltip,
    trigger: 'item',
    formatter: (p: { name: string; value: number[] }) => {
      const total = linhas.find((l) => l.p === p.name)?.r.indice_total;
      return (
        `<strong>${p.name}</strong>, ${ano}<br/>` +
        DIMENSOES.map((d, i) => `${INDEX_SHORT[d]}: <strong>${formato(p.value[i])}</strong>`).join('<br/>') +
        (total === undefined ? '' : `<br/>Total index: <strong>${formato(total)}</strong>`)
      );
    },
  });

  const rotuloVertice = { formatter: (x: { value: number }) => f1(x.value), color: TINTA, fontSize: 11, fontWeight: 650 };

  const sobreposto = useMemo(
    () => ({
      ...BASE,
      tooltip: tooltipItem(f6),
      radar: celular ? radar('64%', 11, true) : radar('76%', 12.5),
      series: desenho.map(({ p, r }) => {
        const principal = p === paises[0];
        const realcado = foco ? p === foco : principal;
        const apagado = foco !== null && p !== foco;
        return {
          type: 'radar',
          id: p,
          name: p,
          z: foco === p ? 4 : principal ? 3 : 2,
          symbol: 'circle',
          symbolSize: realcado ? 7 : 6,
          label: { ...rotuloVertice, show: realcado },
          emphasis: {
            focus: 'series',
            lineStyle: { width: 3.5 },
            areaStyle: { color: rgba(cor(p), 0.26) },
            label: { ...rotuloVertice, show: true },
          },
          blur: { lineStyle: { opacity: 0.12 }, itemStyle: { opacity: 0.12 }, areaStyle: { opacity: 0.1 }, label: { show: false } },
          data: [
            {
              name: p,
              value: DIMENSOES.map((d) => r[d]),
              itemStyle: { color: cor(p), borderColor: '#fff', borderWidth: 1.5, opacity: apagado ? 0.15 : 1 },
              lineStyle: { color: cor(p), width: foco === p ? 3.5 : principal ? 2.5 : 1.75, opacity: apagado ? 0.15 : 1 },
              areaStyle: { color: rgba(cor(p), foco === p ? 0.26 : apagado ? 0.02 : principal ? 0.16 : 0.04) },
            },
          ],
        };
      }),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registros, paises, ano, ocultos, foco, celular],
  );

  const individuais = useMemo(
    () =>
      linhas.map(({ p, r }) => ({
        p,
        total: r.indice_total,
        option: {
          ...BASE,
          tooltip: tooltipItem(f2),
          radar: radar(celular ? '52%' : '72%', 11.5, true),
          series: [
            {
              type: 'radar',
              symbolSize: 5,
              label: { show: true, formatter: (x: { value: number }) => f1(x.value), color: TINTA, fontSize: 11.5, fontWeight: 600 },
              data: [
                {
                  name: p,
                  value: DIMENSOES.map((d) => r[d]),
                  itemStyle: { color: cor(p) },
                  lineStyle: { color: cor(p), width: 2 },
                  areaStyle: { color: rgba(cor(p), 0.2) },
                },
              ],
            },
          ],
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [registros, paises, ano, celular],
  );

  // Destaque a partir da tabela ao lado: realça o país no radar e apaga os outros.
  const destacar = (p: string | null) => setFoco(p && !ocultos.includes(p) ? p : null);

  function alternar(p: string) {
    setOcultos((o) => (o.includes(p) ? o.filter((x) => x !== p) : [...o, p]));
    setFoco(null);
  }

  return (
    <PainelGrafico
      titulo={`Dimensions in ${ano}`}
      sub="Each axis is one dimension, from 0 at the center to 100 at the edge."
      vista={vista}
      setVista={setVista}
      extra={
        <>
          <Segmented label="Year" small options={anosDisponiveis} value={ano} onChange={setAno} />
          <Segmented label="Display mode" small options={MODOS} value={modo} onChange={setModo} />
        </>
      }
      tabela={
        <Tabela
          cabecalho={['Country', ...DIMENSOES.map((d) => <ComCor key={d} cor={INDEX_COLORS[d]}>{INDEX_SHORT[d]}</ComCor>)]}
          linhas={linhas.map(({ p, r }) => [p, ...DIMENSOES.map((d) => f2(r[d]))])}
        />
      }
    >
      {paises.length === 1 && <Alert>{AVISO_COMPARAR}</Alert>}
      {modo === 'Overlay' ? (
        <div className="radar-sobreposto">
          <EChart
            option={sobreposto}
            height={celular ? 340 : 480}
            label={`Radar chart of the five dimensions in ${ano}`}
            mesclar
            eventos={{
              mouseover: (e) => setFocoGrafico(e.seriesName ?? null),
              mouseout: () => setFocoGrafico(null),
            }}
          />
          <div className="radar-lista" onMouseLeave={() => destacar(null)}>
            <div className="radar-lista-linha radar-lista-cabeca" aria-hidden="true">
              <span>Country</span>
              {COLUNAS_RADAR.map((c) => (
                <span key={c} title={INDEX_LABELS[c]}>
                  {COLUNA_CURTA[c]}
                </span>
              ))}
            </div>
            {linhas.map(({ p, r }) => {
              const oculto = ocultos.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  className={`radar-lista-linha${(foco ?? focoGrafico) === p ? ' radar-lista-foco' : ''}${oculto ? ' radar-lista-oculta' : ''}${p === paises[0] ? ' radar-lista-principal' : ''}`}
                  aria-pressed={!oculto}
                  aria-label={`${p}: ${COLUNAS_RADAR.map((c) => `${INDEX_SHORT[c]} ${f2(r[c])}`).join(', ')}. ${oculto ? 'Show' : 'Hide'} on the chart.`}
                  onMouseEnter={() => destacar(p)}
                  onFocus={() => destacar(p)}
                  onBlur={() => destacar(null)}
                  onClick={() => alternar(p)}
                >
                  <span className="radar-lista-nome">
                    <span className="ponto-cor" style={{ background: oculto ? 'transparent' : cor(p), borderColor: cor(p) }} />
                    {p}
                  </span>
                  {COLUNAS_RADAR.map((c) => (
                    <span key={c} className={linhas.length > 1 && r[c] === maiores[c] ? 'radar-lista-maior' : undefined}>
                      {f1(r[c])}
                    </span>
                  ))}
                </button>
              );
            })}
            <p className="radar-lista-nota">
              Hover a country to highlight it on the chart; click to hide or show it.
              {linhas.length > 1 && ' Bold marks the highest score among the selected countries.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="radares" data-colunas={colunasLado(individuais.length)}>
          {individuais.map(({ p, total, option }) => (
            <div key={p}>
              <p className="radar-titulo">
                <span className="ponto-cor" style={{ background: cor(p) }} />
                {p}
                <span className="radar-titulo-total">Total {f2(total)}</span>
              </p>
              <EChart
                option={option}
                height={celular ? 280 : colunasLado(individuais.length) <= 2 ? 360 : 310}
                label={`Radar chart of ${p} in ${ano}`}
              />
            </div>
          ))}
        </div>
      )}
    </PainelGrafico>
  );
}
