import { describe, expect, test } from 'vitest';
import { ANO_MAX, ANO_MIN, PAISES, REGISTROS, carregarDados, intervaloAnos, posicao, type Registro } from '../shared/dados';

describe('dados', () => {
  test('cobertura completa: todo país tem todos os anos', () => {
    expect(REGISTROS.length).toBe(PAISES.length * (ANO_MAX - ANO_MIN + 1));
  });

  test('países em ordem de ponto de código, como sorted() do Python', () => {
    expect(PAISES).toEqual([...PAISES].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  });

  test('filtro mantém a ordem (país, ano) do Supabase, não a da seleção', () => {
    const r = carregarDados({ countries: ['Germany', 'Brazil'], years: intervaloAnos(2020, 2021) });
    expect(r.map((x) => `${x.country_name} ${x.year}`)).toEqual([
      'Brazil 2020', 'Brazil 2021', 'Germany 2020', 'Germany 2021',
    ]);
  });

  test('posição igual ao rank(ascending=False, method="min") do pandas, com empates', () => {
    const base = { country_cod: 'X', year: 2020, indice_socio_cultural: 0, indice_mercados_negocios: 0,
      indice_empreendedorismo: 0, indice_eficiencia_governo: 0, indice_ambiente_juridico: 0 };
    const linhas = [50, 70, 70, 10].map((v, i) => ({ ...base, country_name: `P${i}`, indice_total: v })) as Registro[];
    expect(linhas.map((l) => posicao(linhas, l.country_name, 'indice_total'))).toEqual([3, 1, 1, 4]);
  });
});
