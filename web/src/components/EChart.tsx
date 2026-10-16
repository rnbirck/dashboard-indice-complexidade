import { useEffect, useRef, type RefObject } from 'react';
import type { EChartsCoreOption } from 'echarts/core';

type Evento = { seriesName?: string; dataIndex?: number };
type Manipulador = (e: Evento) => void;

export type Instancia = {
  setOption: (o: EChartsCoreOption, opcoes?: boolean | { replaceMerge: string[] }) => void;
  dispatchAction: (acao: Record<string, unknown>) => void;
  on: (nome: string, f: Manipulador) => void;
  resize: () => void;
  dispose: () => void;
};

const carregar = () => import('../lib/echarts').then((m) => m.default);

/**
 * Gráfico ECharts em SVG, com largura do contêiner e redesenho ao redimensionar.
 * `eventos` recebe eventos do gráfico (mouseover, mouseout...); `instancia` dá acesso ao
 * gráfico para destacar séries a partir de elementos de fora dele. Com `mesclar`, as atualizações
 * trocam só as séries (casadas pelo id) e animam a transição, sem redesenhar o gráfico do zero.
 */
export function EChart({ option, height, label, eventos, instancia, mesclar }: {
  option: EChartsCoreOption;
  height: number;
  label: string;
  eventos?: Record<string, Manipulador>;
  instancia?: RefObject<Instancia | null>;
  mesclar?: boolean;
}) {
  const el = useRef<HTMLDivElement>(null);
  const grafico = useRef<Instancia | null>(null);
  const ultimosEventos = useRef(eventos);
  ultimosEventos.current = eventos;

  useEffect(() => {
    let ativo = true;
    let observador: ResizeObserver | undefined;
    void carregar().then((echarts) => {
      if (!ativo || !el.current) return;
      const g = echarts.init(el.current, null, { renderer: 'svg' }) as unknown as Instancia;
      grafico.current = g;
      if (instancia) instancia.current = g;
      g.setOption(option, true);
      for (const nome of Object.keys(ultimosEventos.current ?? {})) {
        g.on(nome, (e) => ultimosEventos.current?.[nome]?.(e));
      }
      observador = new ResizeObserver(() => g.resize());
      observador.observe(el.current);
    });
    return () => {
      ativo = false;
      observador?.disconnect();
      grafico.current?.dispose();
      grafico.current = null;
      if (instancia) instancia.current = null;
    };
    // A opção inicial entra aqui; as seguintes, no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    grafico.current?.setOption(option, mesclar ? { replaceMerge: ['series'] } : true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option]);

  return <div ref={el} className="echart" style={{ height }} role="img" aria-label={label} />;
}
