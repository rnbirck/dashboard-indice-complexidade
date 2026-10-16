import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { strFromU8 } from 'fflate';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { gerarCsv } from '../shared/arquivos';
import { carregarDados, intervaloAnos } from '../shared/dados';
import type { Mensagem } from '../shared/emails';
import { administradores, configurado, type Anexo } from '../server/envio';
import { criarLimite, criarServidor, origemPermitida } from '../server/servidor';

const ENV = {
  SENDER_EMAIL: 'dados@exemplo.test',
  SENDER_PASSWORD: 'senha-de-teste',
  ADMIN_EMAIL: 'admin@exemplo.test',
  ADDITIONAL_NOTIFICATION_EMAILS: ' equipe@exemplo.test, ,outro@exemplo.test',
};

describe('configuração do e-mail', () => {
  test('administradores: ADMIN_EMAIL e os adicionais, sem vazios', () => {
    expect(administradores(ENV)).toEqual(['admin@exemplo.test', 'equipe@exemplo.test', 'outro@exemplo.test']);
    expect(administradores({ ADDITIONAL_NOTIFICATION_EMAILS: 'a@b.c' })).toEqual(['a@b.c']);
  });

  test('exige remetente, senha e um administrador, como o original', () => {
    expect(configurado(ENV)).toBe(true);
    expect(configurado({ ...ENV, SENDER_PASSWORD: '' })).toBe(false);
    expect(configurado({ ...ENV, ADMIN_EMAIL: '', ADDITIONAL_NOTIFICATION_EMAILS: '' })).toBe(false);
  });
});

describe('proteções', () => {
  test('origem: só o próprio site', () => {
    expect(origemPermitida('https://indice.example', 'indice.example')).toBe(true);
    expect(origemPermitida('https://outro.example', 'indice.example')).toBe(false);
    expect(origemPermitida(undefined, 'indice.example')).toBe(false);
    expect(origemPermitida('lixo', 'indice.example')).toBe(false);
  });

  test('limite de envios por endereço, renovado depois da janela', () => {
    let agora = 0;
    const limite = criarLimite(2, 1000, () => agora);
    expect([limite('a'), limite('a'), limite('a'), limite('b')]).toEqual([true, true, false, true]);
    agora = 1001;
    expect(limite('a')).toBe(true);
  });
});

describe('servidor', () => {
  const enviados: { mensagem: Mensagem; anexo?: Anexo }[] = [];
  let falhar = false;
  let base = '';
  let fechar = () => {};

  beforeAll(async () => {
    const pasta = mkdtempSync(join(tmpdir(), 'indice-dist-'));
    mkdirSync(join(pasta, 'assets'));
    writeFileSync(join(pasta, 'index.html'), '<!doctype html><title>Index</title>' + 'x'.repeat(2000));
    writeFileSync(join(pasta, 'assets', 'app-abc123.js'), 'console.log(1);');
    const servidor = criarServidor({
      pasta,
      env: ENV,
      enviar: async (mensagem, anexo) => {
        if (falhar) throw new Error('SMTP fora do ar');
        enviados.push({ mensagem, anexo });
      },
      limite: criarLimite(100, 60_000),
    });
    await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok));
    base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
    fechar = () => servidor.close();
  });
  afterAll(() => fechar());

  const postar = (rota: string, corpo: object, origem = base) =>
    fetch(base + rota, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origem }, body: JSON.stringify(corpo) });

  test('entrega o site: index sem cache, assets imutáveis, rotas do app e 404', async () => {
    const index = await fetch(base + '/?page=Dashboard&country=Brazil', { headers: { 'Accept-Encoding': 'br, gzip' } });
    expect(index.status).toBe(200);
    expect(index.headers.get('cache-control')).toBe('no-cache');
    expect(index.headers.get('content-encoding')).toBe('br');
    expect(await index.text()).toContain('<title>Index</title>');

    const asset = await fetch(base + '/assets/app-abc123.js');
    expect(asset.headers.get('cache-control')).toContain('immutable');
    expect(asset.headers.get('content-type')).toContain('text/javascript');

    expect((await fetch(base + '/qualquer/pagina')).status).toBe(200);
    expect((await fetch(base + '/assets/nao-existe.js')).status).toBe(404);
    expect((await fetch(base + '/healthz')).status).toBe(200);
  });

  test('contato: administrador primeiro, depois a confirmação', async () => {
    enviados.length = 0;
    const r = await postar('/api/contact', { name: 'Ana', email: 'ana@exemplo.test', subject: 'Olá', message: 'Oi' });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    expect(enviados.map((e) => e.mensagem.para)).toEqual([administradores(ENV), ['ana@exemplo.test']]);
    expect(enviados[0].mensagem.assunto).toBe('Contact Form Submission: Olá');
  });

  test('download: anexo montado no servidor, igual ao CSV do site', async () => {
    enviados.length = 0;
    const r = await postar('/api/download', {
      user_name: 'Ana', user_email: 'ana@exemplo.test', institution: 'UFRGS', purpose: 'Pesquisa',
      download_countries: ['Germany', 'Brazil'], download_years: [2017, 2021], file_format: 'CSV',
    });
    expect(r.status).toBe(200);
    const [usuario, admin] = enviados;
    expect(usuario.mensagem.para).toEqual(['ana@exemplo.test']);
    expect(usuario.anexo?.filename).toBe('institutional_complexity_index_2017_2021.csv');
    const esperado = gerarCsv(carregarDados({ countries: ['Germany', 'Brazil'], years: intervaloAnos(2017, 2021) }));
    expect(strFromU8(usuario.anexo!.content)).toBe(strFromU8(esperado));
    expect(admin.mensagem.assunto).toBe('New Data Download Request - Ana');
    expect(admin.anexo).toBeUndefined();
  });

  test('validação, pedido inválido, outra origem e método', async () => {
    const vazio = await postar('/api/contact', { name: '', email: 'a@b.c', subject: 's', message: 'm' });
    expect(vazio.status).toBe(400);
    expect(((await vazio.json()) as { mensagem: string }).mensagem).toBe('❌ Please fill in all required fields marked with *');

    const pais = await postar('/api/download', {
      user_name: 'A', user_email: 'a@b.c', institution: 'I', purpose: 'P',
      download_countries: ['Atlantis'], download_years: [2015, 2023], file_format: 'CSV',
    });
    expect(pais.status).toBe(400);

    expect((await postar('/api/contact', { name: 'A' }, 'https://outro.example')).status).toBe(403);
    expect((await fetch(base + '/api/contact')).status).toBe(405);
  });

  test('falha no SMTP vira erro de envio, sem expor o detalhe', async () => {
    falhar = true;
    const r = await postar('/api/contact', { name: 'Ana', email: 'ana@exemplo.test', subject: 'Olá', message: 'Oi' });
    falhar = false;
    expect(r.status).toBe(502);
    expect(await r.json()).toEqual({ ok: false, tipo: 'envio', mensagem: 'the email could not be sent' });
  });
});
