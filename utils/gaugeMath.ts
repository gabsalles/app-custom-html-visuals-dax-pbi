// utils/gaugeMath.ts
//
// Fase 4, Etapa 0: extraído de Preview.tsx pra virar testável de verdade.
// Antes, essas duas contas só existiam como Math.min/Math.max inline dentro
// do JSX do donut/gauge — o teste da Fase 0.5 que validou esse fix rodava
// contra uma fórmula COPIADA À MÃO no script, não contra o código real.
// Extrair pra cá fecha essa lacuna: o teste em gaugeMath.test.ts agora
// importa e executa exatamente o que Preview.tsx usa.

import { DonutSlice } from '../types';
import { DONUT_RADIUS, GAUGE_CHART_SIZE_MIN, GAUGE_CHART_SIZE_MAX } from './visualConstants';

/**
 * Percentual (0-100) usado pelo modo 'completeness' do gauge — mesmo clamp
 * que _D{di}_Pct faz em produção (ver utils/daxGenerator.ts).
 */
// TS-CONSISTENCY:BEGIN donutModeFormula
export function resolveCompletenessPct(previewPercent: number | undefined): number {
  return Math.min(100, Math.max(0, previewPercent ?? 75));
}

/**
 * Soma clampada (0-100) das fatias de teste do modo 'distribution' — usada
 * como aproximação do valor central quando não há teste real de
 * centerTextValueMeasure (ver Fase 1 item 1 pra esse mecanismo).
 */
export function resolveDistributionTotal(slices: DonutSlice[]): number {
  const sum = slices.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);
  return Math.min(100, Math.max(0, sum));
}
// TS-CONSISTENCY:END

// ─────────────────────────────────────────────────────────────
// Fix do gauge (chartSize/sizePct não crescia acima de um teto fixo
// desconectado do input, no modo semicírculo — bug reportado com evidência
// visual).
//
// Round 1 (percentuais independentes width%/height%, ratio fixo calibrado
// pra bater com a proporção do arco) resolveu o "não cresce mais" mas não a
// causa raiz: a fórmula nunca conhecia a proporção REAL do card, só o
// próprio sizePct — num card alto/estreito, `min(largura, altura)` do
// `preserveAspectRatio="meet"` continua limitado pela largura, e a "altura
// calculada" sobra como espaço morto dentro da própria caixa do SVG.
//
// Round 2 (aqui): usa a propriedade CSS `aspect-ratio`, que resolve a causa
// raiz de verdade — o browser calcula sozinho qual dimensão (largura ou
// altura disponível) é o limite, sem sobra, sem precisar medir o container
// em JS (inviável aqui, a saída é HTML/CSS estático). O viewBox do SVG
// também é recortado pra bater exatamente com a região onde o arco é
// desenhado (em vez do quadrado 100x100 inteiro, que tem metade vazia pro
// semicírculo) — box e viewBox com a MESMA proporção elimina letterbox por
// completo, e o texto central passa a poder usar top:50% de novo (relativo
// à caixa recortada, não ao container inteiro), porque o recorte já É
// exatamente a região do conteúdo.
// ─────────────────────────────────────────────────────────────

/**
 * Clamp defensivo do valor de "Escala (Tamanho %)" — usado tanto no
 * onChange do input (Editor.tsx) quanto na leitura em Preview.tsx/
 * daxGenerator.ts, pra proteger contra estado salvo antes deste fix
 * existir (ex.: um `chartSize: 901010101` gravado no localStorage).
 */
export function resolveChartSizePct(chartSize: number | undefined): number {
  return Math.min(GAUGE_CHART_SIZE_MAX, Math.max(GAUGE_CHART_SIZE_MIN, chartSize || 90));
}

/** viewBox recortado + aspect-ratio CSS pro modo semicírculo. */
export interface GaugeSemiGeometry {
  /** Atributo viewBox do <svg> — recortado pra região onde o arco de fato
   * é desenhado (cx=cy=50, r=DONUT_RADIUS, mais folga de sw/2 pro stroke),
   * em vez do quadrado 0 0 100 100 inteiro (que sobra metade vazia). */
  viewBox: string;
  /** Valor CSS `aspect-ratio` — MESMA proporção do viewBox acima, de
   * propósito: zero letterbox quando os dois batem exatamente. */
  aspectRatio: string;
}

/**
 * Geometria do semicírculo — depende da espessura do anel (`ringThickness`),
 * não é fixa. O arco vai, em unidades do viewBox 0-100 original, de
 * `(50 - DONUT_RADIUS - sw/2)` até `(50 + sw/2)` no eixo Y (e simetricamente
 * no eixo X, já que a base do semicírculo é o diâmetro inteiro) — essa
 * região é o novo viewBox recortado.
 */
export function resolveGaugeSemiGeometry(ringThickness: number | undefined): GaugeSemiGeometry {
  const sw = ringThickness || 12;
  const min = 50 - DONUT_RADIUS - sw / 2;
  const width = 2 * DONUT_RADIUS + sw;
  const height = DONUT_RADIUS + sw;
  return {
    viewBox: `${min} ${min} ${width} ${height}`,
    aspectRatio: `${width} / ${height}`,
  };
}
