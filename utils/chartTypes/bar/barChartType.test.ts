// utils/chartTypes/bar/barChartType.test.ts
//
// Fase 4, Etapa 5. Segue o padrão de daxGenerator.test.ts: casos sintéticos
// reais (chama generateDax de verdade), aspas balanceadas, equivalência de
// formatação condicional.

import { describe, it, expect } from 'vitest';
import { barChartType } from './barChartType';
import { BarChartConfig } from '../../../types';
import { GlobalConfig } from '../../../types';

const quoteBalance = (s: string) => (s.match(/"/g) || []).length % 2 === 0;

const baseGlobal = {} as GlobalConfig; // generateDax não usa ctx.global nesta versão

function barConfig(overrides: Partial<BarChartConfig> = {}): BarChartConfig {
  return {
    id: 'bar1',
    title: 'Vendas por Região',
    bars: [
      { id: 'b1', label: 'Norte', measurePlaceholder: '[VendasNorte]', color: '#4f46e5', value: '0' },
      { id: 'b2', label: 'Sul', measurePlaceholder: '[VendasSul]', color: '#059669', value: '0' },
      { id: 'b3', label: 'Sudeste', measurePlaceholder: '[VendasSudeste]', color: '#f59e0b', value: '0' },
    ],
    formatType: 'currency', decimalPlaces: 0,
    ...overrides,
  };
}

describe('barChartType.generateDax — estrutura básica', () => {
  it('gera VAR por barra + max via MAX() encadeado + pct via DIVIDE(...,...,0)', () => {
    const { vars, html } = barChartType.generateDax(barConfig(), { global: baseGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_Tit = "Vendas por Região"');
    expect(vars).toContain('VAR _Bar1_S1_Val_Raw = [VendasNorte]');
    expect(vars).toContain('VAR _Bar1_S2_Val_Raw = [VendasSul]');
    expect(vars).toContain('VAR _Bar1_S3_Val_Raw = [VendasSudeste]');
    // MAX() é binário em DAX — 3 valores viram MAX(MAX(a, b), c)
    expect(vars).toContain('VAR _Bar1_Max = MAX(MAX(_Bar1_S1_Val_Raw, _Bar1_S2_Val_Raw), _Bar1_S3_Val_Raw)');
    // Proteção contra todas zeradas: DIVIDE(...,...,0) — mesmo idioma do 'progress' existente
    expect(vars).toContain('VAR _Bar1_S1_Pct = MAX(0, DIVIDE(_Bar1_S1_Val_Raw, _Bar1_Max, 0))');
    expect(quoteBalance(vars + html)).toBe(true);
  });

  it('1 barra só: Max = o próprio valor, sem MAX() encadeado desnecessário', () => {
    const { vars } = barChartType.generateDax(barConfig({ bars: [{ id: 'b1', label: 'Único', measurePlaceholder: '[V]', color: '#4f46e5', value: '0' }] }), { global: baseGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_Max = _Bar1_S1_Val_Raw');
  });

  it('0 barras: Max cai pra 0 literal, sem gerar MAX() vazio', () => {
    const { vars } = barChartType.generateDax(barConfig({ bars: [] }), { global: baseGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_Max = 0');
  });

  it('índices diferentes geram VARs com prefixo correto (_Bar{index})', () => {
    const { vars } = barChartType.generateDax(barConfig(), { global: baseGlobal, index: 3 });
    expect(vars).toContain('VAR _Bar3_Tit');
    expect(vars).not.toContain('_Bar1_');
  });
});

describe('barChartType.generateDax — formatação condicional por barra', () => {
  const rules: BarChartConfig['conditionalRules'] = [
    { id: 'r1', operator: '<', value: 1000, color: '#dc2626' },
    { id: 'r2', operator: '>=', value: 1000, color: '#059669' },
  ];

  it('sem regras: cor estática por barra (bar.color), sem SWITCH', () => {
    const { html } = barChartType.generateDax(barConfig(), { global: baseGlobal, index: 1 });
    expect(html).not.toContain('SWITCH(TRUE()');
    expect(html).toContain('background: #4f46e5;'); // cor da barra 1 (Norte)
  });

  it('com regras: SWITCH usa o valor bruto da PRÓPRIA barra, uma vez por barra', () => {
    const { html } = barChartType.generateDax(barConfig({ conditionalRules: rules }), { global: baseGlobal, index: 1 });
    expect((html.match(/SWITCH\(TRUE\(\)/g) || []).length).toBe(3); // 1 por barra
    expect(html).toContain('_Bar1_S1_Val_Raw < 1000, "#dc2626"');
    expect(html).toContain('_Bar1_S2_Val_Raw < 1000, "#dc2626"');
    expect(html).toContain('_Bar1_S3_Val_Raw < 1000, "#dc2626"');
  });

  it('getConditionalTarget retorna null (multi-valor não usa o hook único)', () => {
    expect(barChartType.getConditionalTarget(barConfig())).toBeNull();
  });
});

describe('barChartType.generateDax — casos de borda', () => {
  it('rótulo/título com caracteres normais não quebra as aspas', () => {
    const { vars, html } = barChartType.generateDax(barConfig({ title: 'Vendas — Q4' }), { global: baseGlobal, index: 1 });
    expect(quoteBalance(vars + html)).toBe(true);
  });

  it('muitas barras (10) gera sem erro, aspas balanceadas', () => {
    const bars = Array.from({ length: 10 }, (_, i) => ({ id: `b${i}`, label: `Cat ${i}`, measurePlaceholder: `[V${i}]`, color: '#4f46e5', value: '0' }));
    const { vars, html } = barChartType.generateDax(barConfig({ bars }), { global: baseGlobal, index: 1 });
    expect(quoteBalance(vars + html)).toBe(true);
    expect((html.match(/class='bar-row'/g) || []).length).toBe(10);
  });
});
