// Tratamento dos formulários Contact Us e Data Download (antes src/pages/contact.py e download.py).
// Recebem o corpo JSON já lido e devolvem o status HTTP e a resposta que a página interpreta.
import { gerarCsv, gerarXlsx, nomeArquivo } from '../shared/arquivos.ts';
import { ANO_MAX, ANO_MIN, PAISES, carregarDados, intervaloAnos } from '../shared/dados.ts';
import { agora, emailsContato, emailsDownload, validarCampos, type PedidoDownload, type RespostaEnvio } from '../shared/emails.ts';
import { ERRO_ENVIO, administradores, configurado, texto, type Enviador, type Env } from './envio.ts';

export type Resultado = { status: number; corpo: RespostaEnvio };

const INVALIDO: Resultado = { status: 400, corpo: { ok: false, tipo: 'validacao', mensagem: 'Invalid request' } };
const PAISES_VALIDOS = new Set(PAISES);

export async function contato(corpo: Record<string, unknown>, env: Env, enviar: Enviador): Promise<Resultado> {
  const c = {
    name: texto(corpo.name, 200),
    email: texto(corpo.email, 200),
    subject: texto(corpo.subject, 300),
    message: texto(corpo.message, 10_000),
  };
  const erro = validarCampos([c.name, c.email, c.subject, c.message], c.email);
  if (erro) return { status: 400, corpo: { ok: false, tipo: 'validacao', mensagem: erro } };
  if (!configurado(env)) return { status: 503, corpo: { ok: false, tipo: 'configuracao' } };

  try {
    for (const mensagem of emailsContato(c, administradores(env), agora())) await enviar(mensagem);
    return { status: 200, corpo: { ok: true } };
  } catch (e) {
    console.error('contato: envio falhou', e);
    return { status: 502, corpo: { ok: false, tipo: 'envio', mensagem: ERRO_ENVIO } };
  }
}

// O arquivo é montado aqui, a partir do mesmo JSON do site, e nunca vem do navegador.
export async function download(corpo: Record<string, unknown>, env: Env, enviar: Enviador): Promise<Resultado> {
  const anos = corpo.download_years;
  const paises = corpo.download_countries;
  if (
    !Array.isArray(anos) || anos.length !== 2 ||
    !anos.every((a) => Number.isInteger(a) && a >= ANO_MIN && a <= ANO_MAX) || anos[0] > anos[1] ||
    !Array.isArray(paises) || !paises.every((p) => typeof p === 'string' && PAISES_VALIDOS.has(p)) ||
    (corpo.file_format !== 'CSV' && corpo.file_format !== 'Excel')
  ) {
    return INVALIDO;
  }

  const pedido: PedidoDownload = {
    user_name: texto(corpo.user_name, 200),
    user_email: texto(corpo.user_email, 200),
    institution: texto(corpo.institution, 300),
    purpose: texto(corpo.purpose, 5_000),
    download_countries: paises as string[],
    download_years: [anos[0], anos[1]],
    file_format: corpo.file_format,
  };
  const erro = validarCampos([pedido.user_name, pedido.user_email, pedido.institution, pedido.purpose], pedido.user_email);
  if (erro) return { status: 400, corpo: { ok: false, tipo: 'validacao', mensagem: erro } };
  if (!configurado(env)) return { status: 503, corpo: { ok: false, tipo: 'configuracao' } };

  const registros = carregarDados({ countries: pedido.download_countries, years: intervaloAnos(...pedido.download_years) });
  const anexo = {
    filename: nomeArquivo(pedido.download_years, pedido.file_format),
    content: pedido.file_format === 'CSV' ? gerarCsv(registros) : gerarXlsx(registros),
  };

  try {
    const [usuario, admin] = emailsDownload(pedido, registros.length, administradores(env), agora());
    await enviar(usuario, anexo);
    await enviar(admin);
    return { status: 200, corpo: { ok: true } };
  } catch (e) {
    console.error('download: envio falhou', e);
    return { status: 502, corpo: { ok: false, tipo: 'envio', mensagem: ERRO_ENVIO } };
  }
}
