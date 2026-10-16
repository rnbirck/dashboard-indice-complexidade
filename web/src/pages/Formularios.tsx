// Contact Us e Data Download: formulários que enviam e-mail pelo servidor (/api/contact e /api/download).
// Validação, mensagens e conteúdo dos e-mails seguem o app original.
import { useMemo, useState, type ReactNode } from 'react';
import { gerarCsv, gerarXlsx, nomeArquivo } from '../../shared/arquivos';
import { ANO_MAX, ANO_MIN, PAISES, carregarDados, intervaloAnos } from '../../shared/dados';
import { validarCampos, type RespostaEnvio } from '../../shared/emails';
import { RangeSlider } from '../components/RangeSlider';
import { Multiselect } from '../components/Select';
import { Alert, Button, Painel, Segmented, TextArea, TextInput, WidgetLabel } from '../components/st';

type Retorno = { tipo: 'success' | 'error' | 'info'; conteudo: ReactNode }[];

const INSTRUCOES_ADMIN = (
  <>
    <p>
      <strong>For Administrator:</strong> Please configure the following environment variables:
    </p>
    <ul>
      <li>SMTP_SERVER (default: smtp.gmail.com)</li>
      <li>SMTP_PORT (default: 587)</li>
      <li>SENDER_EMAIL</li>
      <li>SENDER_PASSWORD</li>
      <li>ADMIN_EMAIL</li>
      <li>ADDITIONAL_NOTIFICATION_EMAILS (optional, comma-separated)</li>
    </ul>
  </>
);

async function postar(url: string, corpo: object): Promise<RespostaEnvio> {
  try {
    const resposta = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    // Sem o servidor (ex.: no npm run dev), a resposta não é JSON: erro legível no lugar do erro do parser.
    if (!resposta.headers.get('content-type')?.includes('application/json')) {
      return { ok: false, tipo: 'envio', mensagem: `the email service did not respond (HTTP ${resposta.status})` };
    }
    return (await resposta.json()) as RespostaEnvio;
  } catch (e) {
    return { ok: false, tipo: 'envio', mensagem: e instanceof Error ? e.message : String(e) };
  }
}

function Mensagens({ itens }: { itens: Retorno }) {
  return itens.map((m, i) => (
    <Alert key={i} tipo={m.tipo}>
      {typeof m.conteudo === 'string' ? <p>{m.conteudo}</p> : m.conteudo}
    </Alert>
  ));
}

function erroDeEnvio(r: Exclude<RespostaEnvio, { ok: true }>, inicio: string, ajuda: string): Retorno {
  if (r.tipo === 'configuracao') {
    return [
      { tipo: 'error', conteudo: '❌ Email configuration not found. Please contact the administrator.' },
      { tipo: 'info', conteudo: INSTRUCOES_ADMIN },
    ];
  }
  if (r.tipo === 'validacao') return [{ tipo: 'error', conteudo: r.mensagem }];
  return [
    { tipo: 'error', conteudo: `${inicio}${r.mensagem}` },
    { tipo: 'info', conteudo: ajuda },
  ];
}

export function Contact() {
  const [campos, setCampos] = useState({ name: '', email: '', subject: '', message: '' });
  const [enviando, setEnviando] = useState(false);
  const [retorno, setRetorno] = useState<Retorno>([]);
  const campo = (nome: keyof typeof campos) => (v: string) => setCampos((c) => ({ ...c, [nome]: v }));

  async function enviar() {
    const erro = validarCampos([campos.name, campos.email, campos.subject, campos.message], campos.email);
    if (erro) return setRetorno([{ tipo: 'error', conteudo: erro }]);
    setEnviando(true);
    const r = await postar('/api/contact', campos);
    setEnviando(false);
    setRetorno(
      r.ok
        ? [{ tipo: 'success', conteudo: `✅ Message sent successfully! We've sent a confirmation to ${campos.email}.` }]
        : erroDeEnvio(r, '❌ Error sending message: ', 'If the problem persists, please contact us directly at contact@research.org'),
    );
  }

  return (
    <>
      <div>
        <h1 className="pagina-titulo">Contact us</h1>
        <p className="pagina-intro">
          Have questions, suggestions, or collaboration opportunities? We'd love to hear from you! Fill out the form
          below and we'll get back to you as soon as possible.
        </p>
      </div>
      <div className="form-layout">
        <Painel titulo="Send us a message">
          <form
            className="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <div className="form-grade">
              <TextInput label="Name *" placeholder="Your full name" value={campos.name} onChange={campo('name')} autoComplete="name" />
              <TextInput
                label="Email *"
                type="email"
                placeholder="your.email@example.com"
                value={campos.email}
                onChange={campo('email')}
                autoComplete="email"
              />
              <div className="inteiro">
                <TextInput
                  label="Subject *"
                  placeholder="Brief subject of your message"
                  value={campos.subject}
                  onChange={campo('subject')}
                />
              </div>
              <div className="inteiro">
                <TextArea label="Message *" placeholder="Type your message here..." rows={6} value={campos.message} onChange={campo('message')} />
              </div>
            </div>
            <Button type="submit" disabled={enviando} largo>
              {enviando ? 'Sending...' : 'Send Message'}
            </Button>
            <Mensagens itens={retorno} />
          </form>
        </Painel>
        <div className="lado">
          <Painel titulo="Privacy notice">
            <div className="painel-corpo-texto">
              <p>
                Your personal information will be used solely to respond to your inquiry and will not be shared with
                third parties.
              </p>
            </div>
          </Painel>
          <Painel titulo="What happens next">
            <div className="painel-corpo-texto">
              <p>You receive a copy of your message by email right after sending it.</p>
              <p>The research team replies to the address you provide.</p>
            </div>
          </Painel>
        </div>
      </div>
    </>
  );
}

function baixar(bytes: Uint8Array, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Quando o e-mail falha, o arquivo pode ser baixado direto no navegador. */
function DownloadAlternativo({ paises, anos }: { paises: string[]; anos: [number, number] }) {
  const registros = carregarDados({ countries: paises, years: intervaloAnos(...anos) });
  return (
    <div className="resumo">
      <span>
        <strong>Alternative: Direct Download</strong>
      </span>
      <span className="acoes">
        <Button variante="secundario" onClick={() => baixar(gerarCsv(registros), nomeArquivo(anos, 'CSV'), 'text/csv')}>
          Download as CSV
        </Button>
        <Button
          variante="secundario"
          onClick={() =>
            baixar(gerarXlsx(registros), nomeArquivo(anos, 'Excel'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
          }
        >
          Download as Excel
        </Button>
      </span>
    </div>
  );
}

const FORMATOS = ['CSV', 'Excel'] as const;

export function Download() {
  const [campos, setCampos] = useState({ user_name: '', user_email: '', institution: '', purpose: '' });
  const [paises, setPaises] = useState<string[]>([]);
  const [anos, setAnos] = useState<[number, number]>([ANO_MIN, ANO_MAX]);
  const [formato, setFormato] = useState<(typeof FORMATOS)[number]>('CSV');
  const [enviando, setEnviando] = useState(false);
  const [retorno, setRetorno] = useState<Retorno>([]);
  const [alternativo, setAlternativo] = useState<{ paises: string[]; anos: [number, number] } | null>(null);
  const campo = (nome: keyof typeof campos) => (v: string) => setCampos((c) => ({ ...c, [nome]: v }));
  const registros = useMemo(() => carregarDados({ countries: paises, years: intervaloAnos(...anos) }).length, [paises, anos]);

  async function enviar() {
    setAlternativo(null);
    const erro = validarCampos([campos.user_name, campos.user_email, campos.institution, campos.purpose], campos.user_email);
    if (erro) return setRetorno([{ tipo: 'error', conteudo: erro }]);
    setEnviando(true);
    const r = await postar('/api/download', { ...campos, download_countries: paises, download_years: anos, file_format: formato });
    setEnviando(false);
    if (r.ok) {
      setRetorno([
        { tipo: 'success', conteudo: `✅ Success! The data has been sent to ${campos.user_email}. Please check your inbox (and spam folder).` },
      ]);
      return;
    }
    setRetorno(erroDeEnvio(r, '❌ Error sending email: ', 'If the problem persists, please contact the administrator.'));
    if (r.tipo === 'envio') setAlternativo({ paises, anos });
  }

  return (
    <>
      <div>
        <h1 className="pagina-titulo">Data download request</h1>
        <p className="pagina-intro">
          To download the Institutional Complexity Index data, please fill out the form below. The data will be sent to
          your email address.
        </p>
      </div>
      <div className="form-layout">
        <Painel titulo="Download request form">
          <form
            className="form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void enviar();
            }}
          >
            <p className="form-secao">About you</p>
            <div className="form-grade">
              <TextInput label="Full Name *" placeholder="Enter your full name" value={campos.user_name} onChange={campo('user_name')} autoComplete="name" />
              <TextInput
                label="Email Address *"
                type="email"
                placeholder="your.email@example.com"
                value={campos.user_email}
                onChange={campo('user_email')}
                autoComplete="email"
              />
              <div className="inteiro">
                <TextInput
                  label="Institution/Organization *"
                  placeholder="University, Company, etc."
                  value={campos.institution}
                  onChange={campo('institution')}
                  autoComplete="organization"
                />
              </div>
              <div className="inteiro">
                <TextArea
                  label="Purpose of Use *"
                  placeholder="Please describe how you intend to use this data"
                  rows={3}
                  value={campos.purpose}
                  onChange={campo('purpose')}
                />
              </div>
            </div>
            <div className="form-separador" />
            <p className="form-secao">Data filters</p>
            <div className="form-grade">
              <Multiselect
                label="Countries"
                extra="Leave empty for all"
                options={PAISES}
                placeholder="All countries"
                value={paises}
                onChange={setPaises}
              />
              <RangeSlider label="Year range" min={ANO_MIN} max={ANO_MAX} value={anos} onChange={setAnos} />
              <div>
                <WidgetLabel>Preferred format</WidgetLabel>
                <Segmented label="Preferred format" options={FORMATOS} value={formato} onChange={setFormato} />
              </div>
            </div>
            <div className="resumo">
              <span>
                The file will have <strong>{registros.toLocaleString('en-US')} records</strong> for{' '}
                <strong>{paises.length ? `${paises.length} ${paises.length === 1 ? 'country' : 'countries'}` : 'all countries'}</strong>,{' '}
                {anos[0]} to {anos[1]}, as {formato}.
              </span>
            </div>
            <Button type="submit" disabled={enviando} largo>
              {enviando ? 'Sending...' : 'Request Data'}
            </Button>
            <Mensagens itens={retorno} />
            {alternativo && <DownloadAlternativo {...alternativo} />}
          </form>
        </Painel>
        <div className="lado">
          <Painel titulo="About the values">
            <div className="painel-corpo-texto">
              <p>
                All index values range from 0 to 100, where higher values indicate better institutional quality. The total
                index is calculated as the average of the five component indices.
              </p>
            </div>
          </Painel>
          <Painel titulo="Privacy">
            <div className="painel-corpo-texto">
              <p>Your information will only be used for research purposes and will not be shared with third parties.</p>
            </div>
          </Painel>
        </div>
      </div>
    </>
  );
}
