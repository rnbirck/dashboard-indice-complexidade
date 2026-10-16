// Tokens dos gráficos: mesmos valores das variáveis CSS de styles.css.
export const FONTE = '"Public Sans Variable", "Segoe UI", system-ui, sans-serif';

export const TINTA = '#172033';
export const TINTA_2 = '#4b5567';
export const APAGADO = '#7d8696';
export const GRADE = '#e6e8ec';
export const EIXO = '#c9cdd4';
export const SUPERFICIE = '#ffffff';

/**
 * Cor de cada país pela posição na seleção (principal primeiro). Oito tons em ordem fixa,
 * validados para daltonismo entre vizinhos; por isso a comparação aceita até 7 países além do principal.
 */
export const PALETA_PAISES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
export const MAX_COMPARACAO = PALETA_PAISES.length - 1;

export function rgba(hex: string, alfa: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

const texto = { fontFamily: FONTE, color: TINTA_2, fontSize: 12 };

/** Base comum: fonte, tooltip claro com borda fina e eixos recessivos. */
export const BASE = {
  textStyle: { fontFamily: FONTE, color: TINTA_2 },
  animationDuration: 450,
  animationDurationUpdate: 350,
  tooltip: {
    confine: true,
    backgroundColor: SUPERFICIE,
    borderColor: GRADE,
    borderWidth: 1,
    padding: [8, 10],
    textStyle: { ...texto, color: TINTA, fontSize: 12 },
    extraCssText: 'box-shadow: 0 6px 20px rgba(23, 32, 51, 0.10); border-radius: 8px;',
  },
};

export const EIXO_X_ANOS = (anos: number[]) => ({
  type: 'category',
  data: anos.map(String),
  // Meia faixa de folga nas pontas: os rótulos do primeiro e do último ano não invadem os eixos.
  boundaryGap: true,
  axisLine: { lineStyle: { color: EIXO } },
  axisTick: { show: false },
  axisLabel: { ...texto, color: APAGADO, margin: 12 },
});

export const EIXO_Y_VALOR = {
  type: 'value',
  scale: true,
  splitNumber: 4,
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { ...texto, color: APAGADO },
  splitLine: { lineStyle: { color: GRADE } },
};
