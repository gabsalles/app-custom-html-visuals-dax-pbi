// utils/categoricalCards.test.ts
//
// Fase 4, Etapa 0. Testa buildRenderItems() — versão atual (pós-rework do
// mini-grid), não a antiga flattenCategoricalCards() (removida do código,
// por isso não tem teste aqui — testaria função que não existe mais).

import { describe, it, expect } from 'vitest';
import { buildRenderItems } from './categoricalCards';
import { CardConfig } from '../types';

function baseCard(id: string, overrides: Partial<CardConfig> = {}): CardConfig {
  return {
    id, title: `Card ${id}`, measurePlaceholder: '[Vendas]',
    formatType: 'currency', decimalPlaces: 0, prefix: 'R$ ', suffix: '',
    type: 'simple', progressValue: 0, targetMeasurePlaceholder: '', value: '0',
    icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false,
    comparisons: [{ id: 'cp1', label: 'MoM', value: '', trend: 'up', logic: 'true', measurePlaceholder: '[D]' }],
    ...overrides,
  };
}

describe('buildRenderItems', () => {
  it('card normal vira item kind=card, intacto (com comparativos)', () => {
    const r = buildRenderItems([baseCard('c1')], {});
    expect(r.items).toHaveLength(1);
    expect(r.items[0].kind).toBe('card');
    if (r.items[0].kind === 'card') {
      expect(r.items[0].card.comparisons).toHaveLength(1);
    }
  });

  it('categórico vira item kind=group, ordenado por valor desc, sem comparativos nos slots', () => {
    const catCard = baseCard('c2', {
      categorical: { column: "'Produtos'[Cat]", maxSlots: 10, showOthersBucket: true, sortBy: 'value_desc', testCategories: ['Norte', 'Sul', 'Sudeste'], columns: 4 },
    });
    const r = buildRenderItems([catCard], { c2_cat_0: 100, c2_cat_1: 300, c2_cat_2: 200 });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].kind).toBe('group');
    if (r.items[0].kind !== 'group') throw new Error('esperava group');
    const { sourceCard, slots } = r.items[0].data;
    expect(sourceCard.categorical?.columns).toBe(4);
    expect(slots.map(s => s.title)).toEqual(['Sul', 'Sudeste', 'Norte']);
    expect(slots.every(s => s.comparisons.length === 0)).toBe(true);
    expect(r.effectiveTestValues['c2__slot_0']).toBe(300);
  });

  it('Outros calcula a soma do excedente corretamente', () => {
    const catCard = baseCard('c3', {
      categorical: { column: "'Produtos'[Cat]", maxSlots: 2, showOthersBucket: true, sortBy: 'value_desc', testCategories: ['A', 'B', 'C', 'D'], columns: 3 },
    });
    const r = buildRenderItems([catCard], { c3_cat_0: 100, c3_cat_1: 400, c3_cat_2: 50, c3_cat_3: 250 });
    if (r.items[0].kind !== 'group') throw new Error('esperava group');
    const { slots } = r.items[0].data;
    expect(slots.map(s => s.title)).toEqual(['B', 'D', 'Outros']);
    expect(r.effectiveTestValues['c3__slot_others']).toBe(150); // A(100) + C(50)
    expect(slots.find(s => s.title === 'Outros')?.conditionalRules).toBeUndefined();
  });

  it('showOthersBucket=false: excedente some, sem gerar Outros', () => {
    const catCard = baseCard('c4', {
      categorical: { column: "'Produtos'[Cat]", maxSlots: 2, showOthersBucket: false, sortBy: 'alpha', testCategories: ['Zeta', 'Alfa', 'Beta'], columns: 2 },
    });
    const r = buildRenderItems([catCard], { c4_cat_0: 1, c4_cat_1: 2, c4_cat_2: 3 });
    if (r.items[0].kind !== 'group') throw new Error('esperava group');
    expect(r.items[0].data.slots.map(s => s.title)).toEqual(['Alfa', 'Beta']);
  });

  it('mistura card normal + grupo categórico, ordem da lista original preservada', () => {
    const catCard = baseCard('c2', {
      categorical: { column: "'Produtos'[Cat]", maxSlots: 10, showOthersBucket: true, sortBy: 'value_desc', testCategories: ['Norte', 'Sul'], columns: 2 },
    });
    const r = buildRenderItems([baseCard('x1'), catCard, baseCard('x2')], { c2_cat_0: 1, c2_cat_1: 2 });
    expect(r.items.map(i => i.kind)).toEqual(['card', 'group', 'card']);
  });
});
