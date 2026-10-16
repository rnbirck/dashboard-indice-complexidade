// st.slider com intervalo (value=(min, max)): trilho de 4 px, alças de 12 px e valores sobre as alças.
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { WidgetLabel } from './st';

// Rótulo centrado na alça, preso às bordas do trilho para não vazar da barra lateral.
const posicaoRotulo = (p: number) => (p < 8 ? 'esquerda' : p > 92 ? 'direita' : 'centro');

export function RangeSlider({ label, min, max, value, onChange }: {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const arrastando = useRef<0 | 1 | null>(null);
  const pct = (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100);

  function valorNoPonto(x: number) {
    const r = trilho.current!.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (x - r.left) / r.width));
    return Math.round(min + frac * (max - min));
  }
  function mover(alca: 0 | 1, v: number) {
    const novo: [number, number] = [...value];
    novo[alca] = alca === 0 ? Math.min(v, value[1]) : Math.max(v, value[0]);
    if (novo[0] !== value[0] || novo[1] !== value[1]) onChange(novo);
  }
  function inicio(e: PointerEvent<HTMLDivElement>) {
    const v = valorNoPonto(e.clientX);
    const alca: 0 | 1 = Math.abs(v - value[0]) <= Math.abs(v - value[1]) && v <= value[1] ? 0 : 1;
    arrastando.current = alca;
    e.currentTarget.setPointerCapture(e.pointerId);
    mover(alca, v);
  }
  function teclas(alca: 0 | 1, e: KeyboardEvent) {
    const passo = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (passo === undefined) return;
    e.preventDefault();
    mover(alca, Math.min(max, Math.max(min, value[alca] + passo)));
  }

  const [a, b] = value.map(pct);
  return (
    <div className="st-slider">
      <WidgetLabel>{label}</WidgetLabel>
      <div
        className="st-slider-area"
        onPointerDown={inicio}
        onPointerMove={(e) => arrastando.current !== null && mover(arrastando.current, valorNoPonto(e.clientX))}
        onPointerUp={() => (arrastando.current = null)}
      >
        <div
          ref={trilho}
          className="st-slider-track"
          style={{
            background: `linear-gradient(to right, var(--linha) 0%, var(--linha) ${a}%, var(--realce) ${a}%, var(--realce) ${b}%, var(--linha) ${b}%, var(--linha) 100%)`,
          }}
        >
          {([0, 1] as const).map((alca) => (
            <div
              key={alca}
              role="slider"
              tabIndex={0}
              aria-label={label}
              aria-valuemin={min}
              aria-valuemax={max}
              aria-valuenow={value[alca]}
              className="st-slider-thumb"
              style={{ left: `${[a, b][alca]}%` }}
              onKeyDown={(e) => teclas(alca, e)}
            >
              <div className={`st-slider-value ${posicaoRotulo([a, b][alca])}`}>{value[alca]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
