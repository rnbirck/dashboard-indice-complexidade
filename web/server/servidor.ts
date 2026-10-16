// Servidor do Railway: entrega o site (dist/) e recebe os formulários em /api/contact e /api/download.
// Sem framework: o site é estático e são só duas rotas de e-mail.
import { readdirSync, readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { extname, join, relative, sep } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import type { RespostaEnvio } from '../shared/emails.ts';
import type { Enviador, Env } from './envio.ts';
import { contato, download } from './formularios.ts';

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};
const COMPRIMIVEL = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt']);

type Arquivo = { corpo: Buffer; tipo: string; br?: Buffer; gzip?: Buffer };

/** Lê o dist inteiro na memória (cerca de 1,5 MB), já comprimido, para servir sem tocar o disco. */
function carregarSite(pasta: string): Map<string, Arquivo> {
  const site = new Map<string, Arquivo>();
  for (const nome of readdirSync(pasta, { recursive: true, withFileTypes: true })) {
    if (!nome.isFile()) continue;
    const caminho = join(nome.parentPath, nome.name);
    const ext = extname(caminho);
    const corpo = readFileSync(caminho);
    const arquivo: Arquivo = { corpo, tipo: TIPOS[ext] ?? 'application/octet-stream' };
    if (COMPRIMIVEL.has(ext) && corpo.length > 1024) {
      arquivo.br = brotliCompressSync(corpo, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
      arquivo.gzip = gzipSync(corpo, { level: 9 });
    }
    site.set('/' + relative(pasta, caminho).split(sep).join('/'), arquivo);
  }
  if (!site.has('/index.html')) throw new Error(`index.html não encontrado em ${pasta}; rode npm run build`);
  return site;
}

const SEGURANCA = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' };

function servirArquivo(req: IncomingMessage, res: ServerResponse, caminho: string, arquivo: Arquivo) {
  const aceita = String(req.headers['accept-encoding'] ?? '');
  const [corpo, codificacao] =
    arquivo.br && /\bbr\b/.test(aceita) ? [arquivo.br, 'br'] : arquivo.gzip && /\bgzip\b/.test(aceita) ? [arquivo.gzip, 'gzip'] : [arquivo.corpo, null];
  res.writeHead(200, {
    ...SEGURANCA,
    'Content-Type': arquivo.tipo,
    'Content-Length': corpo.length,
    // Os arquivos de /assets têm hash no nome; o index.html é revalidado a cada visita.
    'Cache-Control': caminho.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : caminho === '/index.html' ? 'no-cache' : 'public, max-age=3600',
    ...(arquivo.br || arquivo.gzip ? { Vary: 'Accept-Encoding' } : {}),
    ...(codificacao ? { 'Content-Encoding': codificacao } : {}),
  });
  res.end(req.method === 'HEAD' ? undefined : corpo);
}

function responderJson(res: ServerResponse, status: number, corpo: RespostaEnvio) {
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    ...SEGURANCA,
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(texto),
    'Cache-Control': 'no-store',
  });
  res.end(texto);
}

/** Lê o corpo JSON com limite de tamanho; corpo grande demais ou malformado vira null. */
async function lerCorpo(req: IncomingMessage): Promise<Record<string, unknown> | null> {
  const partes: Buffer[] = [];
  let tamanho = 0;
  for await (const parte of req) {
    tamanho += (parte as Buffer).length;
    if (tamanho > 20_000) return null;
    partes.push(parte as Buffer);
  }
  try {
    const corpo = JSON.parse(Buffer.concat(partes).toString('utf-8'));
    return corpo && typeof corpo === 'object' && !Array.isArray(corpo) ? corpo : null;
  } catch {
    return null;
  }
}

/**
 * Aceita só pedidos do próprio site: navegadores mandam Origin em POST, e um formulário
 * de outro domínio não consegue usar o servidor para disparar e-mails.
 */
export function origemPermitida(origem: string | undefined, host: string | undefined): boolean {
  if (!origem || !host) return false;
  try {
    return new URL(origem).host === host;
  } catch {
    return false;
  }
}

/**
 * Limite de envios por endereço: cada pedido dispara e-mails pela conta do Gmail, inclusive
 * para o endereço digitado, e o Gmail bloqueia contas que enviam demais.
 */
export function criarLimite(maximo: number, janelaMs: number, relogio = () => Date.now()) {
  const pedidos = new Map<string, number[]>();
  return (ip: string): boolean => {
    const agora = relogio();
    const recentes = (pedidos.get(ip) ?? []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= maximo) {
      pedidos.set(ip, recentes);
      return false;
    }
    recentes.push(agora);
    pedidos.set(ip, recentes);
    if (pedidos.size > 10_000) pedidos.clear();
    return true;
  };
}

// O proxy do Railway informa o endereço do visitante em X-Real-IP; o último item do
// X-Forwarded-For é o que o proxy acrescentou (os anteriores podem vir do próprio visitante).
const ip = (req: IncomingMessage) =>
  String(req.headers['x-real-ip'] ?? '') ||
  String(req.headers['x-forwarded-for'] ?? '').split(',').pop()?.trim() ||
  req.socket.remoteAddress ||
  '';

export function criarServidor({ pasta, env, enviar, limite = criarLimite(10, 10 * 60_000) }: {
  pasta: string;
  env: Env;
  enviar: Enviador;
  limite?: (ip: string) => boolean;
}): Server {
  const site = carregarSite(pasta);
  const rotas = { '/api/contact': contato, '/api/download': download } as const;

  return createServer(async (req, res) => {
    try {
      let caminho: string;
      try {
        caminho = decodeURIComponent((req.url ?? '/').split('?')[0]);
      } catch {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Bad request');
      }
      if (caminho === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
        return res.end('ok');
      }

      if (Object.hasOwn(rotas, caminho)) {
        if (req.method !== 'POST') {
          res.writeHead(405, { Allow: 'POST' });
          return res.end();
        }
        const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '');
        if (!origemPermitida(req.headers.origin, host)) {
          return responderJson(res, 403, { ok: false, tipo: 'validacao', mensagem: 'Invalid request' });
        }
        if (!limite(ip(req))) {
          return responderJson(res, 429, {
            ok: false,
            tipo: 'validacao',
            mensagem: '❌ Too many requests. Please try again in a few minutes.',
          });
        }
        const corpo = await lerCorpo(req);
        if (!corpo) return responderJson(res, 400, { ok: false, tipo: 'validacao', mensagem: 'Invalid request' });
        const { status, corpo: resposta } = await rotas[caminho as keyof typeof rotas](corpo, env, enviar);
        console.log(`${caminho} ${status}`);
        return responderJson(res, status, resposta);
      }

      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end();
      }
      const arquivo = site.get(caminho === '/' ? '/index.html' : caminho);
      if (arquivo) return servirArquivo(req, res, caminho === '/' ? '/index.html' : caminho, arquivo);
      // Arquivo inexistente é 404; qualquer outro caminho abre o app, que lê a página da URL.
      if (caminho.startsWith('/assets/') || extname(caminho)) {
        res.writeHead(404, { ...SEGURANCA, 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
      }
      return servirArquivo(req, res, '/index.html', site.get('/index.html')!);
    } catch (e) {
      console.error('erro no servidor', e);
      if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal error');
    }
  });
}
