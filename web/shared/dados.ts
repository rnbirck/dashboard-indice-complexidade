// Dados do índice e as consultas que o app Streamlit fazia ao Supabase (update_load_data.py).
// O JSON é gerado do Postgres `cei` por scripts/gerar_dados.py, já na ordem (país, ano).
import bruto from '../src/data/indice.json';

export const INDICES = [
  'indice_socio_cultural',
  'indice_mercados_negocios',
  'indice_empreendedorismo',
  'indice_eficiencia_governo',
  'indice_ambiente_juridico',
  'indice_total',
] as const;

export type Indice = (typeof INDICES)[number];

export type Registro = {
  country_name: string;
  country_cod: string;
  year: number;
} & Record<Indice, number>;

export const INDEX_LABELS: Record<Indice, string> = {
  indice_socio_cultural: 'Socio-Cultural Index',
  indice_mercados_negocios: 'Markets & Business Index',
  indice_empreendedorismo: 'Entrepreneurship Index',
  indice_eficiencia_governo: 'Government Efficiency Index',
  indice_ambiente_juridico: 'Legal Environment Index',
  indice_total: 'Total Complexity Index',
};

// Uma cor por dimensão, na ordem validada da paleta categórica (protan/deutan ΔE >= 9);
// o índice total é a linha de referência, em tinta escura e mais grossa.
export const INDEX_COLORS: Record<Indice, string> = {
  indice_socio_cultural: '#2a78d6',
  indice_mercados_negocios: '#eb6834',
  indice_empreendedorismo: '#1baf7a',
  indice_eficiencia_governo: '#eda100',
  indice_ambiente_juridico: '#e87ba4',
  indice_total: '#172033',
};

/** Rótulos curtos, sem "Index", para eixos, legendas e o radar. */
export const INDEX_SHORT: Record<Indice, string> = {
  indice_socio_cultural: 'Socio-Cultural',
  indice_mercados_negocios: 'Markets & Business',
  indice_empreendedorismo: 'Entrepreneurship',
  indice_eficiencia_governo: 'Government Efficiency',
  indice_ambiente_juridico: 'Legal Environment',
  indice_total: 'Total index',
};

const { colunas, linhas } = bruto as { colunas: string[]; linhas: (string | number)[][] };

export const REGISTROS: Registro[] = linhas.map(
  (linha) => Object.fromEntries(colunas.map((coluna, i) => [coluna, linha[i]])) as Registro,
);

// Python sorted(): comparação por ponto de código, não por localidade.
const porCodigo = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export const PAISES: string[] = [...new Set(REGISTROS.map((r) => r.country_name))].sort(porCodigo);

const anos = REGISTROS.map((r) => r.year);
export const ANO_MIN = Math.min(...anos);
export const ANO_MAX = Math.max(...anos);

/** load_complexity_data: filtra por países e anos, mantendo a ordem (país, ano). */
export function carregarDados(filtro: { countries?: readonly string[]; years?: readonly number[] } = {}): Registro[] {
  const paises = filtro.countries?.length ? new Set(filtro.countries) : null;
  const anosFiltro = filtro.years?.length ? new Set(filtro.years) : null;
  return REGISTROS.filter(
    (r) => (!paises || paises.has(r.country_name)) && (!anosFiltro || anosFiltro.has(r.year)),
  );
}

export function intervaloAnos(inicio: number, fim: number): number[] {
  return Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
}

/** pandas rank(ascending=False, method="min"): 1 + quantos valores são estritamente maiores. */
export function posicao(registros: readonly Registro[], pais: string, indice: Indice): number {
  const alvo = registros.find((r) => r.country_name === pais);
  if (!alvo) throw new Error(`${pais} sem dados no ano`);
  return 1 + registros.filter((r) => r[indice] > alvo[indice]).length;
}
