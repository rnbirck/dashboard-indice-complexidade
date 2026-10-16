// Envio pelo SMTP do Gmail, com as mesmas variáveis de ambiente do app Streamlit no Railway.
import nodemailer from 'nodemailer';
import type { Mensagem } from '../shared/emails.ts';

export interface Env {
  SMTP_SERVER?: string;
  SMTP_PORT?: string;
  SENDER_EMAIL?: string;
  SENDER_PASSWORD?: string;
  ADMIN_EMAIL?: string;
  /** E-mails adicionais que recebem as notificações, separados por vírgula. */
  ADDITIONAL_NOTIFICATION_EMAILS?: string;
}

export type Anexo = { filename: string; content: Uint8Array };

/** Envia uma mensagem; o servidor usa o SMTP e os testes passam um envio simulado. */
export type Enviador = (mensagem: Mensagem, anexo?: Anexo) => Promise<void>;

/** Destinatários das notificações, como no original: ADMIN_EMAIL mais os adicionais. */
export function administradores(env: Env): string[] {
  const adicionais = (env.ADDITIONAL_NOTIFICATION_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  return [...(env.ADMIN_EMAIL ? [env.ADMIN_EMAIL] : []), ...adicionais];
}

/** Mesma checagem do Python: remetente, senha e ao menos um administrador. */
export function configurado(env: Env): boolean {
  return Boolean(env.SENDER_EMAIL && env.SENDER_PASSWORD && administradores(env).length);
}

/**
 * smtplib.SMTP(servidor, porta) + starttls() + login(), com os padrões do original
 * (smtp.gmail.com, 587). Na porta 465 a conexão já começa em TLS.
 */
export function criarEnviador(env: Env): Enviador {
  const porta = Number(env.SMTP_PORT || 587);
  const transporte = nodemailer.createTransport({
    host: env.SMTP_SERVER || 'smtp.gmail.com',
    port: porta,
    secure: porta === 465,
    requireTLS: porta !== 465,
    auth: { user: env.SENDER_EMAIL, pass: env.SENDER_PASSWORD },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  return async (mensagem, anexo) => {
    await transporte.sendMail({
      from: env.SENDER_EMAIL,
      to: mensagem.para.join(', '),
      subject: mensagem.assunto,
      text: mensagem.texto,
      // O original anexava como application/octet-stream, com o nome do arquivo.
      attachments: anexo
        ? [{ filename: anexo.filename, content: Buffer.from(anexo.content), contentType: 'application/octet-stream' }]
        : undefined,
    });
  };
}

export const ERRO_ENVIO = 'the email could not be sent';

export const texto = (valor: unknown, limite: number): string =>
  typeof valor === 'string' ? valor.slice(0, limite) : '';
