import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, test } from 'vitest';
import { gerarCsv, gerarXlsx, nomeArquivo, reprPython } from '../shared/arquivos';
import { carregarDados } from '../shared/dados';

describe('reprPython', () => {
  test.each([
    [47.74877721062193, '47.74877721062193'],
    [100, '100.0'],
    [0, '0.0'],
    [-0.5, '-0.5'],
    [0.0001, '0.0001'],
    [0.00001, '1e-05'],
    [1.5e-7, '1.5e-07'],
    [1e16, '1e+16'],
    [123456789012345680, '1.2345678901234568e+17'],
    [1234567890123456, '1234567890123456.0'],
  ])('%s -> %s', (valor, esperado) => {
    expect(reprPython(valor)).toBe(esperado);
  });
});

describe('arquivos de download', () => {
  const registros = carregarDados({ countries: ['Brazil'], years: [2023] });

  test('CSV com as colunas do Supabase, n_dims_ok vazio e ano inteiro', () => {
    const [cabecalho, linha, fim] = strFromU8(gerarCsv(registros)).split('\n');
    expect(cabecalho).toBe(
      'Year,Country Name,Country Code,Socio-Cultural Index,Markets & Business Index,Entrepreneurship Index,' +
        'Government Efficiency Index,Legal Environment Index,n_dims_ok,Total Complexity Index',
    );
    expect(linha).toMatch(/^2023,Brazil,BRA,[\d.]+,[\d.]+,[\d.]+,[\d.]+,[\d.]+,,[\d.]+$/);
    expect(fim).toBe('');
  });

  test('Excel com a aba "Complexity Index" e uma linha por registro', () => {
    const partes = unzipSync(gerarXlsx(registros));
    expect(strFromU8(partes['xl/workbook.xml'])).toContain('name="Complexity Index"');
    const planilha = strFromU8(partes['xl/worksheets/sheet1.xml']);
    expect(planilha).toContain('<dimension ref="A1:J2"/>');
    expect(planilha).toContain('<t>Markets &amp; Business Index</t>');
  });

  test('nome do arquivo como no original', () => {
    expect(nomeArquivo([2015, 2023], 'CSV')).toBe('institutional_complexity_index_2015_2023.csv');
    expect(nomeArquivo([2018, 2020], 'Excel')).toBe('institutional_complexity_index_2018_2020.xlsx');
  });
});
