// Peças simples da interface: avisos, rótulos, campos, controle segmentado, painel e botões.
import type { ReactNode } from 'react';

type Tipo = 'info' | 'warning' | 'error' | 'success';

export function Alert({ tipo = 'info', children }: { tipo?: Tipo; children: ReactNode }) {
  return (
    <div role={tipo === 'error' ? 'alert' : 'status'} className={`aviso aviso-${tipo}`}>
      {children}
    </div>
  );
}

export const WidgetLabel = ({ children, htmlFor, extra }: { children: ReactNode; htmlFor?: string; extra?: ReactNode }) => (
  <label className="rotulo" htmlFor={htmlFor}>
    <span>{children}</span>
    {extra && <small>{extra}</small>}
  </label>
);

export function Painel({ titulo, sub, acoes, children, className }: {
  titulo?: ReactNode;
  sub?: ReactNode;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`painel${className ? ` ${className}` : ''}`}>
      {(titulo || acoes) && (
        <div className="painel-cabeca">
          <div>
            {titulo && <h2 className="painel-titulo">{titulo}</h2>}
            {sub && <p className="painel-sub">{sub}</p>}
          </div>
          {acoes}
        </div>
      )}
      {children}
    </section>
  );
}

/** Grupo de botões exclusivos: abas do Dashboard e escolhas curtas. */
export function Segmented<T extends string>({ label, options, value, onChange, small, render }: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
  render?: (o: T) => ReactNode;
}) {
  return (
    <div role="group" aria-label={label} className={`segmentado${small ? ' segmentado-pequeno' : ''}`}>
      {options.map((opcao) => (
        <button key={opcao} type="button" aria-pressed={opcao === value} onClick={() => onChange(opcao)}>
          {render ? render(opcao) : opcao}
        </button>
      ))}
    </div>
  );
}

export function TextInput({ label, placeholder, value, onChange, type = 'text', autoComplete }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email';
  autoComplete?: string;
}) {
  const id = `ti-${label}`;
  return (
    <div>
      <WidgetLabel htmlFor={id}>{label}</WidgetLabel>
      <div className="campo">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function TextArea({ label, placeholder, value, onChange, rows }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
}) {
  const id = `ta-${label}`;
  return (
    <div>
      <WidgetLabel htmlFor={id}>{label}</WidgetLabel>
      <div className="campo">
        <textarea id={id} rows={rows} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

export function Button({ children, type = 'button', onClick, disabled, variante = 'primario', largo }: {
  children: ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  variante?: 'primario' | 'secundario';
  largo?: boolean;
}) {
  const classes = ['botao', variante === 'secundario' && 'botao-secundario', largo && 'botao-largo'].filter(Boolean);
  return (
    <button className={classes.join(' ')} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
