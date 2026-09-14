// utils/conditionalFormatting.test.ts
//
// Fase 4, Etapa 0. Cobre a lógica de resolução JS (preview) e a checagem de
// equivalência com o que o SWITCH(TRUE(), ...) gerado em DAX produziria pro
// mesmo valor — a simulação do lado DAX é documentada como isso mesmo: uma
// simulação, já que não há motor DAX real disponível neste ambiente.

import { describe, it, expect } from 'vitest';
import { resolveConditionalColor, buildConditionalSwitchDax } from './conditionalFormatting';
import { ConditionalRule } from '../types';

const rules: ConditionalRule[] = [
  { id: 'r1', operator: '<', value: 100, color: '#dc2626' },
  { id: 'r2', operator: '<', value: 500, color: '#f59e0b' },
  { id: 'r3', operator: '>=', value: 500, color: '#059669' },
];
const fallback = '#4f46e5';

describe('resolveConditionalColor', () => {
  it('retorna o fallback sem valor, sem regras, ou lista vazia', () => {
    expect(resolveConditionalColor(undefined, rules, fallback)).toBe(fallback);
    expect(resolveConditionalColor(250, undefined, fallback)).toBe(fallback);
    expect(resolveConditionalColor(250, [], fallback)).toBe(fallback);
  });

  it('primeira regra que casa vence (ordem importa)', () => {
    expect(resolveConditionalColor(50, rules, fallback)).toBe('#dc2626');
    expect(resolveConditionalColor(250, rules, fallback)).toBe('#f59e0b');
    expect(resolveConditionalColor(1000, rules, fallback)).toBe('#059669');
  });

  it("'between' inclui as duas bordas", () => {
    const betweenRules: ConditionalRule[] = [{ id: 'b1', operator: 'between', value: 100, value2: 200, color: '#f59e0b' }];
    expect(resolveConditionalColor(99, betweenRules, fallback)).toBe(fallback);
    expect(resolveConditionalColor(100, betweenRules, fallback)).toBe('#f59e0b');
    expect(resolveConditionalColor(200, betweenRules, fallback)).toBe('#f59e0b');
    expect(resolveConditionalColor(201, betweenRules, fallback)).toBe(fallback);
  });
});

describe('equivalência JS (preview) vs. DAX (produção) — mesma cor pro mesmo valor', () => {
  // Simula o que o SWITCH(TRUE(), ...) gerado por buildConditionalSwitchDax
  // avaliaria pro mesmo valor — não há motor DAX real disponível pra rodar
  // a expressão de fato, então isso é uma simulação equivalente, documentada.
  function simulateDaxSwitch(value: number): string {
    if (value < 100) return '#dc2626';
    if (value < 500) return '#f59e0b';
    if (value >= 500) return '#059669';
    return fallback;
  }

  const testValues = [-50, 0, 99, 99.99, 100, 100.01, 250, 499, 499.99, 500, 500.01, 10000];

  for (const v of testValues) {
    it(`valor=${v}: JS e DAX concordam`, () => {
      expect(resolveConditionalColor(v, rules, fallback)).toBe(simulateDaxSwitch(v));
    });
  }
});

describe('buildConditionalSwitchDax', () => {
  it('retorna null sem regras (chamador deve usar cor estática, sem overhead de SWITCH)', () => {
    expect(buildConditionalSwitchDax('_C1_Val_Raw', undefined, '"#4f46e5"')).toBeNull();
    expect(buildConditionalSwitchDax('_C1_Val_Raw', [], '"#4f46e5"')).toBeNull();
  });

  it('gera SWITCH(TRUE(), ...) com condições na ordem e fallback no final', () => {
    const dax = buildConditionalSwitchDax('_C1_Val_Raw', rules, '"#4f46e5"');
    expect(dax).toBe('SWITCH(TRUE(), _C1_Val_Raw < 100, "#dc2626", _C1_Val_Raw < 500, "#f59e0b", _C1_Val_Raw >= 500, "#059669", "#4f46e5")');
  });

  it("'between' vira AND() em DAX", () => {
    const dax = buildConditionalSwitchDax('_C1_Val_Raw', [{ id: 'b1', operator: 'between', value: 100, value2: 200, color: '#f59e0b' }], '"#4f46e5"');
    expect(dax).toContain('AND(_C1_Val_Raw >= 100, _C1_Val_Raw <= 200)');
  });
});
