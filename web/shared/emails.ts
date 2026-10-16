// Validação e textos dos e-mails, copiados de src/pages/contact.py e download.py do app Streamlit.
// Os corpos são texto puro com os mesmos asteriscos e quebras de linha do original.

export type Contato = { name: string; email: string; subject: string; message: string };

export type PedidoDownload = {
  user_name: string;
  user_email: string;
  institution: string;
  purpose: string;
  download_countries: string[];
  download_years: [number, number];
  file_format: 'CSV' | 'Excel';
};

export type Mensagem = { para: string[]; assunto: string; texto: string };

export const ERRO_CAMPOS = '❌ Please fill in all required fields marked with *';
export const ERRO_EMAIL = '❌ Please enter a valid email address';

/** Mesma checagem do Python: campos preenchidos, "@" e "." no e-mail. Devolve o erro ou null. */
export function validarCampos(campos: string[], email: string): string | null {
  if (campos.some((c) => !c)) return ERRO_CAMPOS;
  if (!email.includes('@') || !email.includes('.')) return ERRO_EMAIL;
  return null;
}

/** datetime.now().strftime("%Y-%m-%d %H:%M:%S") no servidor (UTC, como no Railway). */
export function agora(data = new Date()): string {
  return data.toISOString().slice(0, 19).replace('T', ' ');
}

const milhar = (n: number) => n.toLocaleString('en-US');

export function emailsContato(c: Contato, admins: string[], quando: string): [Mensagem, Mensagem] {
  const admin: Mensagem = {
    para: admins,
    assunto: `Contact Form Submission: ${c.subject}`,
    texto: `
New contact form submission received:

**Sender Information:**
- Name: ${c.name}
- Email: ${c.email}
- Date/Time: ${quando}

**Subject:**
${c.subject}

**Message:**
${c.message}

---
To reply, send an email to: ${c.email}

This is an automated notification from the Institutional Complexity Index Dashboard.
`,
  };
  const usuario: Mensagem = {
    para: [c.email],
    assunto: 'Thank you for contacting us - Institutional Complexity Index',
    texto: `
Dear ${c.name},

Thank you for reaching out to us regarding: "${c.subject}"


For your records, here is a copy of your message:

---
${c.message}
---

Best regards,
Institutional Complexity Index Team
`,
  };
  // O original enviava primeiro ao administrador e depois ao usuário.
  return [admin, usuario];
}

export function emailsDownload(p: PedidoDownload, total: number, admins: string[], quando: string): [Mensagem, Mensagem] {
  const paises = p.download_countries.length ? p.download_countries.join(', ') : 'All';
  const [inicio, fim] = p.download_years;
  const usuario: Mensagem = {
    para: [p.user_email],
    assunto: 'Institutional Complexity Index - Data Download',
    texto: `
Dear ${p.user_name},

Thank you for your interest in the Institutional Complexity Index data.

Please find attached the requested data file.

**Download Details:**
- Format: ${p.file_format}
- Year Range: ${inicio} - ${fim}
- Countries: ${paises}
- Total Records: ${milhar(total)}

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
Institutional Complexity Index Team
`,
  };
  const admin: Mensagem = {
    para: admins,
    assunto: `New Data Download Request - ${p.user_name}`,
    texto: `
New data download request received:

**User Information:**
- Name: ${p.user_name}
- Email: ${p.user_email}
- Institution: ${p.institution}
- Purpose: ${p.purpose}

**Download Details:**
- Date/Time: ${quando}
- Format: ${p.file_format}
- Year Range: ${inicio} - ${fim}
- Countries: ${paises}
- Total Records: ${milhar(total)}

---
This is an automated notification from the Institutional Complexity Index Dashboard.
`,
  };
  // O original enviava primeiro ao usuário (com o anexo) e depois ao administrador.
  return [usuario, admin];
}

/** Respostas de /api/contact e /api/download, interpretadas pela página. */
export type RespostaEnvio =
  | { ok: true }
  | { ok: false; tipo: 'validacao'; mensagem: string }
  | { ok: false; tipo: 'configuracao' }
  | { ok: false; tipo: 'envio'; mensagem: string };
