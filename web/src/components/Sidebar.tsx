// Filtros da barra lateral: país principal, comparação e intervalo de anos.
import { ANO_MAX, ANO_MIN, PAISES } from '../../shared/dados';
import { MAX_COMPARACAO, PALETA_PAISES } from '../lib/tema';
import { RangeSlider } from './RangeSlider';
import { Multiselect, Selectbox } from './Select';

export type Filtros = {
  pais: string | null;
  comparacao: string[];
  anos: [number, number];
};

/** Cor de cada país: o principal na primeira posição, os comparados na ordem em que foram escolhidos. */
export function corPais(filtros: Filtros, pais: string): string {
  const ordem = [filtros.pais, ...filtros.comparacao];
  return PALETA_PAISES[Math.max(0, ordem.indexOf(pais))];
}

export function Sidebar({ filtros, onChange }: { filtros: Filtros; onChange: (f: Filtros) => void }) {
  const { pais, comparacao, anos } = filtros;
  return (
    <div className="filtros">
      <div>
        <h2 className="filtros-titulo">Filters</h2>
        <p className="filtros-ajuda">They apply to every chart on the Dashboard.</p>
      </div>
      <Selectbox
        label="Main country"
        options={PAISES}
        placeholder="Choose a country..."
        value={pais}
        clearable
        onChange={(novo) => onChange({ ...filtros, pais: novo, comparacao: comparacao.filter((c) => c !== novo) })}
      />
      <Multiselect
        label="Compare with"
        extra={`${comparacao.length}/${MAX_COMPARACAO}`}
        options={PAISES.filter((c) => c !== pais)}
        placeholder="Add countries"
        value={comparacao}
        max={MAX_COMPARACAO}
        cor={(c) => corPais(filtros, c)}
        onChange={(novo) => onChange({ ...filtros, comparacao: novo })}
      />
      <RangeSlider
        label="Years"
        min={ANO_MIN}
        max={ANO_MAX}
        value={anos}
        onChange={(novo) => onChange({ ...filtros, anos: novo })}
      />
      <div className="filtros-rodape">
        <p>
          <strong>{PAISES.length}</strong> countries with data for <strong>{ANO_MIN}</strong> to{' '}
          <strong>{ANO_MAX}</strong>.
        </p>
        <p>Main country: {pais ? <strong>{pais}</strong> : 'not selected'}</p>
      </div>
    </div>
  );
}
