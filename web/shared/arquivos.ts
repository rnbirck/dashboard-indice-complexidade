// Arquivos de download (CSV e Excel) idênticos aos que o app Streamlit gerava com pandas.
// Usado no navegador (download alternativo) e nas funções de e-mail (anexo).
import { strToU8, zipSync } from 'fflate';
import type { Registro } from './dados.ts';

// Ordem das colunas da tabela no Supabase, que o pandas mantinha no arquivo. A coluna
// n_dims_ok existia lá sempre vazia e não era renomeada; fica igual por fidelidade.
const COLUNAS: [string, (r: Registro) => string | number | null][] = [
  ['Year', (r) => r.year],
  ['Country Name', (r) => r.country_name],
  ['Country Code', (r) => r.country_cod],
  ['Socio-Cultural Index', (r) => r.indice_socio_cultural],
  ['Markets & Business Index', (r) => r.indice_mercados_negocios],
  ['Entrepreneurship Index', (r) => r.indice_empreendedorismo],
  ['Government Efficiency Index', (r) => r.indice_eficiencia_governo],
  ['Legal Environment Index', (r) => r.indice_ambiente_juridico],
  ['n_dims_ok', () => null],
  ['Total Complexity Index', (r) => r.indice_total],
];

const COLUNAS_INTEIRAS = new Set(['Year']);

export function nomeArquivo(anos: readonly [number, number], formato: 'CSV' | 'Excel'): string {
  return `institutional_complexity_index_${anos[0]}_${anos[1]}.${formato === 'CSV' ? 'csv' : 'xlsx'}`;
}

/** repr() de um float do Python: dígitos mínimos, notação científica fora de 1e-4 <= |x| < 1e16. */
export function reprPython(valor: number): string {
  if (Number.isNaN(valor)) return 'nan';
  if (!Number.isFinite(valor)) return valor > 0 ? 'inf' : '-inf';
  if (valor === 0) return Object.is(valor, -0) ? '-0.0' : '0.0';
  const [mantissa, exp] = valor.toExponential().split('e');
  const expoente = Number(exp);
  const sinal = mantissa.startsWith('-') ? '-' : '';
  const digitos = mantissa.replace('-', '').replace('.', '');
  if (expoente < -4 || expoente >= 16) {
    const resto = digitos.slice(1);
    const e = Math.abs(expoente).toString().padStart(2, '0');
    return `${sinal}${digitos[0]}${resto ? '.' + resto : ''}e${expoente < 0 ? '-' : '+'}${e}`;
  }
  if (expoente < 0) return `${sinal}0.${'0'.repeat(-expoente - 1)}${digitos}`;
  const inteiro = digitos.slice(0, expoente + 1).padEnd(expoente + 1, '0');
  const fracao = digitos.slice(expoente + 1);
  return `${sinal}${inteiro}.${fracao || '0'}`;
}

function celulaCsv(valor: string | number | null, inteira: boolean): string {
  if (valor === null) return '';
  if (typeof valor === 'number') return inteira ? String(valor) : reprPython(valor);
  return /[",\n\r]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor;
}

/** DataFrame.to_csv(index=False), utf-8 sem BOM e fim de linha \n (Railway era Linux). */
export function gerarCsv(registros: readonly Registro[]): Uint8Array {
  const linhas = [COLUNAS.map(([nome]) => celulaCsv(nome, false)).join(',')];
  for (const r of registros) {
    linhas.push(COLUNAS.map(([nome, ler]) => celulaCsv(ler(r), COLUNAS_INTEIRAS.has(nome))).join(','));
  }
  return strToU8(linhas.join('\n') + '\n');
}

const xml = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const letraColuna = (i: number) => String.fromCharCode(65 + i);

function celulaXlsx(ref: string, valor: string | number | null, estilo?: number): string {
  if (valor === null) return '';
  const s = estilo ? ` s="${estilo}"` : '';
  if (typeof valor === 'number') return `<c r="${ref}"${s}><v>${valor}</v></c>`;
  return `<c r="${ref}"${s} t="inlineStr"><is><t>${xml(valor)}</t></is></c>`;
}

/** DataFrame.to_excel(sheet_name="Complexity Index", index=False) com o cabeçalho padrão do pandas. */
export function gerarXlsx(registros: readonly Registro[]): Uint8Array {
  const linhas: string[] = [];
  linhas.push(
    `<row r="1">${COLUNAS.map(([nome], i) => celulaXlsx(`${letraColuna(i)}1`, nome, 1)).join('')}</row>`,
  );
  registros.forEach((r, n) => {
    const linha = n + 2;
    linhas.push(
      `<row r="${linha}">${COLUNAS.map(([, ler], i) => celulaXlsx(`${letraColuna(i)}${linha}`, ler(r))).join('')}</row>`,
    );
  });
  const ultima = `${letraColuna(COLUNAS.length - 1)}${registros.length + 1}`;
  const cab = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const arquivos: Record<string, string> = {
    '[Content_Types].xml':
      cab +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>',
    '_rels/.rels':
      cab +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    'xl/workbook.xml':
      cab +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Complexity Index" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      cab +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>',
    'xl/styles.xml':
      cab +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font>' +
      '<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>' +
      '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' +
      '<border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1">' +
      '<alignment horizontal="center" vertical="top"/></xf></cellXfs>' +
      '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
      '</styleSheet>',
    'xl/worksheets/sheet1.xml':
      cab +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<dimension ref="A1:${ultima}"/><sheetData>${linhas.join('')}</sheetData></worksheet>`,
  };
  return zipSync(Object.fromEntries(Object.entries(arquivos).map(([nome, conteudo]) => [nome, strToU8(conteudo)])));
}
