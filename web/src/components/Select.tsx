// st.selectbox e st.multiselect (BaseWeb no Streamlit): caixa pesquisável, filtro aproximado
// por subsequência, teclado (setas, Enter, Esc) e botão de limpar.
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { WidgetLabel } from './st';

/** Como o filtro do Streamlit: letras na ordem, sem caixa; trechos contíguos e iniciais primeiro. */
function filtrar(opcoes: readonly string[], busca: string, rotulo: (o: string) => string): string[] {
  const termo = busca.trim().toLowerCase();
  if (!termo) return [...opcoes];
  const pontuadas: [string, number][] = [];
  for (const opcao of opcoes) {
    const texto = rotulo(opcao).toLowerCase();
    const indice = texto.indexOf(termo);
    if (indice >= 0) {
      pontuadas.push([opcao, 1000 - indice * 10 - (texto.length - termo.length)]);
      continue;
    }
    let pos = 0;
    let saltos = 0;
    for (const letra of termo) {
      const achou = texto.indexOf(letra, pos);
      if (achou < 0) {
        pos = -1;
        break;
      }
      saltos += achou - pos;
      pos = achou + 1;
    }
    if (pos >= 0) pontuadas.push([opcao, 500 - saltos]);
  }
  return pontuadas.sort((a, b) => b[1] - a[1]).map(([o]) => o);
}

const Chevron = () => (
  <svg className="st-select-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 15.4 6.6 10 8 8.6l4 4 4-4 1.4 1.4z" fill="currentColor" />
  </svg>
);

const Limpar = ({ onClick, titulo }: { onClick: () => void; titulo: string }) => (
  <button
    type="button"
    aria-label={titulo}
    title={titulo}
    className="st-select-clear"
    // mousedown só impede o foco de sair da entrada e a caixa de reabrir;
    // a ação fica no click para também valer com Enter e Espaço.
    onMouseDown={(e) => {
      e.preventDefault();
      e.stopPropagation();
    }}
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"
      />
    </svg>
  </button>
);

type Base = {
  label: string;
  options: readonly string[];
  placeholder: string;
  format?: (o: string) => string;
};

function useDropdown(opcoes: readonly string[], rotulo: (o: string) => string, escolher: (o: string) => void) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [destaque, setDestaque] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);
  const filtradas = useMemo(() => filtrar(opcoes, busca, rotulo), [opcoes, busca, rotulo]);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) fechar();
    };
    document.addEventListener('mousedown', fora);
    return () => document.removeEventListener('mousedown', fora);
  }, [aberto]);

  useEffect(() => {
    lista.current?.children[destaque]?.scrollIntoView({ block: 'nearest' });
  }, [destaque, aberto]);

  function abrir() {
    setAberto(true);
    entrada.current?.focus();
  }
  function fechar() {
    setAberto(false);
    setBusca('');
    setDestaque(0);
  }
  function selecionar(opcao: string) {
    escolher(opcao);
    fechar();
  }
  function teclas(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!aberto) return abrir();
      setDestaque((d) => Math.min(d + 1, filtradas.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDestaque((d) => Math.max(d - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aberto && filtradas[destaque] !== undefined) selecionar(filtradas[destaque]);
    } else if (e.key === 'Escape') {
      fechar();
    }
  }

  const menu = aberto && (
    <div className="st-select-menu">
      <ul ref={lista} role="listbox">
        {filtradas.length === 0 ? (
          <li className="st-select-empty">{opcoes.length ? 'No matches' : 'Selection limit reached'}</li>
        ) : (
          filtradas.map((opcao, i) => (
            <li
              key={opcao}
              role="option"
              aria-selected={i === destaque}
              className={i === destaque ? 'destaque' : undefined}
              onMouseEnter={() => setDestaque(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                selecionar(opcao);
              }}
            >
              {rotulo(opcao)}
            </li>
          ))
        )}
      </ul>
    </div>
  );

  const propsEntrada = {
    ref: entrada,
    value: busca,
    role: 'combobox',
    'aria-expanded': aberto,
    autoComplete: 'off',
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setBusca(e.target.value);
      setDestaque(0);
      setAberto(true);
    },
    onKeyDown: teclas,
    onBlur: () => fechar(),
  };

  return { aberto, busca, raiz, abrir, menu, propsEntrada };
}

function Caixa({ raiz, aberto, abrir, children, label, id, extra }: {
  raiz: RefObject<HTMLDivElement | null>;
  aberto: boolean;
  abrir: () => void;
  children: ReactNode;
  label: string;
  id: string;
  extra?: ReactNode;
}) {
  return (
    <div className="st-select" ref={raiz}>
      <WidgetLabel htmlFor={id} extra={extra}>{label}</WidgetLabel>
      <div
        className={`st-select-box${aberto ? ' aberto' : ''}`}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault();
          abrir();
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Selectbox({ label, options, placeholder, format, value, onChange, clearable = false }: Base & {
  value: string | null;
  onChange: (v: string | null) => void;
  clearable?: boolean;
}) {
  const id = useId();
  const rotulo = format ?? ((o: string) => o);
  const d = useDropdown(options, rotulo, onChange);
  return (
    <Caixa raiz={d.raiz} aberto={d.aberto} abrir={d.abrir} label={label} id={id}>
      <div className="st-select-value">
        {!d.busca && (
          <span className={value === null ? 'st-placeholder' : 'st-select-text'}>
            {value === null ? placeholder : rotulo(value)}
          </span>
        )}
        <input id={id} {...d.propsEntrada} aria-label={label} />
      </div>
      <div className="st-select-icons">
        {clearable && value !== null && <Limpar titulo="Clear value" onClick={() => onChange(null)} />}
        <Chevron />
      </div>
      {d.menu}
    </Caixa>
  );
}

export function Multiselect({ label, options, placeholder, format, value, onChange, cor, max, extra }: Base & {
  value: string[];
  onChange: (v: string[]) => void;
  /** Cor do ponto de cada etiqueta (a mesma do país nos gráficos). */
  cor?: (o: string) => string;
  /** Limite de escolhas; ao atingi-lo, a lista deixa de oferecer opções. */
  max?: number;
  extra?: ReactNode;
}) {
  const id = useId();
  const rotulo = format ?? ((o: string) => o);
  const cheio = max !== undefined && value.length >= max;
  const disponiveis = useMemo(
    () => (cheio ? [] : options.filter((o) => !value.includes(o))),
    [options, value, cheio],
  );
  const d = useDropdown(disponiveis, rotulo, (o) => onChange([...value, o]));
  return (
    <Caixa raiz={d.raiz} aberto={d.aberto} abrir={d.abrir} label={label} id={id} extra={extra}>
      <div className="st-select-value st-multi">
        {value.map((v) => (
          <span key={v} className="st-tag" title={rotulo(v)} style={cor ? { ['--cor-tag' as string]: cor(v) } : undefined}>
            <span className="st-tag-text">{rotulo(v)}</span>
            <button
              type="button"
              aria-label={`Remove ${rotulo(v)}`}
              className="st-tag-x"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onChange(value.filter((x) => x !== v));
              }}
            >
              <svg viewBox="5 5 13.186 13.186" aria-hidden="true">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M7.29289 7.29289C7.68342 6.90237 8.31658 6.90237 8.70711 7.29289L12 10.5858L15.2929 7.29289C15.6834 6.90237 16.3166 6.90237 16.7071 7.29289C17.0976 7.68342 17.0976 8.31658 16.7071 8.70711L13.4142 12L16.7071 15.2929C17.0976 15.6834 17.0976 16.3166 16.7071 16.7071C16.3166 17.0976 15.6834 17.0976 15.2929 16.7071L12 13.4142L8.70711 16.7071C8.31658 17.0976 7.68342 17.0976 7.29289 16.7071C6.90237 16.3166 6.90237 15.6834 7.29289 15.2929L10.5858 12L7.29289 8.70711C6.90237 8.31658 6.90237 7.68342 7.29289 7.29289Z"
                />
              </svg>
            </button>
          </span>
        ))}
        <span className="st-multi-input">
          {!d.busca && (value.length === 0 || cheio) && (
            <span className="st-placeholder">{cheio ? '' : placeholder}</span>
          )}
          <input
            id={id}
            {...d.propsEntrada}
            aria-label={label}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !d.busca && value.length) onChange(value.slice(0, -1));
              else d.propsEntrada.onKeyDown(e);
            }}
          />
        </span>
      </div>
      <div className="st-select-icons">
        {value.length > 0 && <Limpar titulo="Clear all" onClick={() => onChange([])} />}
        <Chevron />
      </div>
      {d.menu}
    </Caixa>
  );
}
