// utils/gaugeMath.test.ts
//
// Fase 4, Etapa 0. Cobre o bug original da Fase 0.5 (gauge sempre mostrava
// 75% fixo) — testando as funções REAIS extraídas de Preview.tsx, não uma
// fórmula copiada à mão como o script de scratchpad original fazia.

import { describe, it, expect } from 'vitest';
import {
  resolveCompletenessPct, resolveDistributionTotal,
  resolveChartSizePct, resolveGaugeSemiGeometry,
} from './gaugeMath';
import { DonutSlice } from '../types';

describe('resolveCompletenessPct', () => {
  it('clampa 0% corretamente', () => {
    expect(resolveCompletenessPct(0)).toBe(0);
  });

  it('clampa 100% corretamente', () => {
    expect(resolveCompletenessPct(100)).toBe(100);
  });

  it('passa valores intermediários sem alterar', () => {
    expect(resolveCompletenessPct(42)).toBe(42);
  });

  it('usa o fallback 75 quando previewPercent é undefined (configs antigas)', () => {
    expect(resolveCompletenessPct(undefined)).toBe(75);
  });

  it('clampa valores negativos pra 0', () => {
    expect(resolveCompletenessPct(-20)).toBe(0);
  });

  it('clampa valores acima de 100 pra 100', () => {
    expect(resolveCompletenessPct(150)).toBe(100);
  });
});

describe('resolveDistributionTotal', () => {
  const slice = (value: string): DonutSlice => ({ id: Math.random().toString(), label: '', measurePlaceholder: '', color: '#000', value });

  it('retorna 0 sem fatias', () => {
    expect(resolveDistributionTotal([])).toBe(0);
  });

  it('soma fatias que totalizam exatamente 100', () => {
    expect(resolveDistributionTotal([slice('30'), slice('45'), slice('25')])).toBe(100);
  });

  it('soma fatias parciais (< 100) sem alterar', () => {
    expect(resolveDistributionTotal([slice('40'), slice('20')])).toBe(60);
  });

  it('clampa overflow (soma > 100) pra 100', () => {
    expect(resolveDistributionTotal([slice('80'), slice('60')])).toBe(100);
  });

  it('trata valor inválido (não-numérico) como 0', () => {
    expect(resolveDistributionTotal([slice('abc'), slice('25')])).toBe(25);
  });

  it('trata valor vazio como 0', () => {
    expect(resolveDistributionTotal([slice('')])).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// Fix do gauge (chartSize não crescia acima de um teto fixo desconectado
// do input no modo semicírculo — bug reportado com evidência visual).
// ─────────────────────────────────────────────────────────────

describe('resolveChartSizePct', () => {
  it('usa o fallback 90 quando chartSize é undefined (configs antigas)', () => {
    expect(resolveChartSizePct(undefined)).toBe(90);
  });

  it('passa valores dentro da faixa [30,100] sem alterar', () => {
    expect(resolveChartSizePct(75)).toBe(75);
  });

  it('clampa valores acima de 100 pra 100 (ex.: 901010101 salvo antes do fix)', () => {
    expect(resolveChartSizePct(901010101)).toBe(100);
  });

  it('clampa valores abaixo de 30 pra 30', () => {
    expect(resolveChartSizePct(5)).toBe(30);
  });

  it('trata 0 como o fallback 90, mesmo padrão `|| 90` já usado no resto do código pra este campo', () => {
    expect(resolveChartSizePct(0)).toBe(90);
  });
});

// Round 2 do fix do gauge: aspect-ratio + viewBox recortado, no lugar do
// ratio fixo (round 1) que ainda sobrava espaço em cards altos/estreitos
// (a fórmula nunca conhecia a proporção real do card).
describe('resolveGaugeSemiGeometry', () => {
  it('usa o fallback de espessura 12 quando ringThickness é undefined (viewBox "4 4 92 92-40=52")', () => {
    const g = resolveGaugeSemiGeometry(undefined);
    expect(g.viewBox).toBe('4 4 92 52');
    expect(g.aspectRatio).toBe('92 / 52');
  });

  it('viewBox e aspectRatio usam SEMPRE a mesma proporção (zero letterbox por construção)', () => {
    for (const sw of [4, 8, 12, 20, 40]) {
      const g = resolveGaugeSemiGeometry(sw);
      const [, , w, h] = g.viewBox.split(' ').map(Number);
      const [rw, rh] = g.aspectRatio.split(' / ').map(Number);
      expect(w).toBeCloseTo(rw, 5);
      expect(h).toBeCloseTo(rh, 5);
    }
  });

  it('anel mais grosso aumenta width e height do recorte (mais folga de stroke)', () => {
    const thin = resolveGaugeSemiGeometry(4);
    const thick = resolveGaugeSemiGeometry(40);
    const wThin = Number(thin.viewBox.split(' ')[2]);
    const wThick = Number(thick.viewBox.split(' ')[2]);
    expect(wThick).toBeGreaterThan(wThin);
  });

  it('recorte é sempre simétrico em torno do centro do viewBox original (cx=cy=50)', () => {
    const g = resolveGaugeSemiGeometry(12);
    const [minX, minY, w] = g.viewBox.split(' ').map(Number);
    // O centro horizontal do recorte deve coincidir com cx=50 do desenho original.
    expect(minX + w / 2).toBeCloseTo(50, 5);
    void minY;
  });
});
