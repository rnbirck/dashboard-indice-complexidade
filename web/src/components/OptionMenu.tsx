// Ícones Bootstrap (os mesmos do menu original) como SVG, sem baixar a fonte inteira.
import barChartLine from 'bootstrap-icons/icons/bar-chart-line.svg?raw';
import download from 'bootstrap-icons/icons/download.svg?raw';
import envelope from 'bootstrap-icons/icons/envelope.svg?raw';
import fileText from 'bootstrap-icons/icons/file-text.svg?raw';
import globe from 'bootstrap-icons/icons/globe.svg?raw';
import graphUp from 'bootstrap-icons/icons/graph-up.svg?raw';
import houseDoor from 'bootstrap-icons/icons/house-door.svg?raw';
import pentagon from 'bootstrap-icons/icons/pentagon.svg?raw';
import personBadge from 'bootstrap-icons/icons/person-badge.svg?raw';
import table from 'bootstrap-icons/icons/table.svg?raw';

const ICONES = {
  'house-door': houseDoor,
  'bar-chart-line': barChartLine,
  'file-text': fileText,
  'person-badge': personBadge,
  envelope,
  download,
  'graph-up': graphUp,
  globe,
  pentagon,
  table,
};

export type NomeIcone = keyof typeof ICONES;

export const Icone = ({ nome }: { nome: NomeIcone }) => (
  <i className="icone" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONES[nome] }} />
);

export type Opcao<T extends string> = { valor: T; icone: NomeIcone };

/** Navegação principal: as mesmas seis páginas do app original, como abas no cabeçalho. */
export function Nav<T extends string>({ opcoes, valor, onChange }: {
  opcoes: readonly Opcao<T>[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <nav className="nav" aria-label="Sections">
      {opcoes.map((opcao) => (
        <a
          key={opcao.valor}
          href="#"
          aria-current={opcao.valor === valor ? 'page' : undefined}
          className={opcao.valor === valor ? 'ativo' : undefined}
          onClick={(e) => {
            e.preventDefault();
            onChange(opcao.valor);
          }}
        >
          <Icone nome={opcao.icone} />
          <span>{opcao.valor}</span>
        </a>
      ))}
    </nav>
  );
}
