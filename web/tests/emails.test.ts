import { describe, expect, test } from 'vitest';
import { ERRO_CAMPOS, ERRO_EMAIL, agora, emailsContato, emailsDownload, validarCampos } from '../shared/emails';

describe('validação', () => {
  test('mesmas regras do Python', () => {
    expect(validarCampos(['a', ''], 'a@b.c')).toBe(ERRO_CAMPOS);
    expect(validarCampos(['a'], 'ab.c')).toBe(ERRO_EMAIL);
    expect(validarCampos(['a'], 'a@bc')).toBe(ERRO_EMAIL);
    expect(validarCampos(['a'], 'a@b.c')).toBeNull();
  });

  test('data no formato %Y-%m-%d %H:%M:%S', () => {
    expect(agora(new Date('2026-10-16T13:05:09.123Z'))).toBe('2026-10-16 13:05:09');
  });
});

describe('textos', () => {
  test('contato: administrador primeiro, depois a confirmação', () => {
    const [admin, usuario] = emailsContato(
      { name: 'Ana', email: 'ana@x.org', subject: 'Oi', message: 'Texto' }, ['adm@x.org'], '2026-10-16 13:05:09');
    expect(admin.para).toEqual(['adm@x.org']);
    expect(admin.assunto).toBe('Contact Form Submission: Oi');
    expect(admin.texto).toContain('**Sender Information:**\n- Name: Ana\n- Email: ana@x.org\n- Date/Time: 2026-10-16 13:05:09');
    expect(usuario.assunto).toBe('Thank you for contacting us - Institutional Complexity Index');
    expect(usuario.texto.startsWith('\nDear Ana,\n')).toBe(true);
  });

  test('download: usuário primeiro, "All" sem países e milhar com vírgula', () => {
    const [usuario, admin] = emailsDownload(
      { user_name: 'Ana', user_email: 'ana@x.org', institution: 'U', purpose: 'P', download_countries: [],
        download_years: [2015, 2023], file_format: 'Excel' },
      1234, ['adm@x.org'], 'agora');
    expect(usuario.para).toEqual(['ana@x.org']);
    expect(usuario.texto).toContain('- Countries: All\n- Total Records: 1,234');
    expect(admin.assunto).toBe('New Data Download Request - Ana');
  });
});
