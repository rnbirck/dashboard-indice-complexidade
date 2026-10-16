// ECharts reduzido ao que o painel usa: linhas, radar, eixos, tooltip e legenda, em SVG.
import { LineChart, RadarChart } from 'echarts/charts';
import { GridComponent, LegendComponent, RadarComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout } from 'echarts/features';
import { SVGRenderer } from 'echarts/renderers';

echarts.use([LineChart, RadarChart, GridComponent, LegendComponent, RadarComponent, TooltipComponent, LabelLayout, SVGRenderer]);

export default echarts;
