// utils/barMigration.test.ts
//
// Cobre a regressão real: BarChartConfig.categorical passou a ser
// obrigatório, mas localStorage['pbi-bars'] salvo pelo modo manual antigo
// (bars: BarSlice[], sem `categorical`) nunca foi migrado — carregar esse
// dado quebrava `config.categorical!` em runtime (tela branca).

import { describe, it, expect } from 'vitest';
import { migrateBarConfig } from './barMigration';

describe('migrateBarConfig', () => {
  it('não altera um config que já tem categorical', () => {
    const bar = {
      id: 'bar1', title: 'Vendas',
      categorical: {
        column: "'T'[Cat]", measurePlaceholder: '[M]',
        maxCategoriesMode: 'fixed' as const, maxCategories: 5,
        sortBy: 'value_desc' as const, sortEnabled: true,
      },
    };
    expect(migrateBarConfig(bar)).toEqual(bar);
  });

  it('migra um config legado (modo manual, bars: BarSlice[], sem categorical) sem lançar', () => {
    const legacy = {
      id: 'bar1', title: 'Vendas por Produto',
      cardBackgroundColor: '#fff', accentColor: '#4f46e5',
      bars: [
        { id: 's1', label: 'Produto A', measurePlaceholder: '[Vendas A]', color: '#f00', value: '10' },
        { id: 's2', label: 'Produto B', measurePlaceholder: '[Vendas B]', color: '#0f0', value: '20' },
      ],
    };
    const migrated = migrateBarConfig(legacy);

    expect(migrated.categorical).toBeDefined();
    expect(migrated.categorical.column).toBe('');
    expect(migrated.categorical.measurePlaceholder).toBe('');
    expect(migrated.categorical.maxCategoriesMode).toBe('fixed');
  });

  it('preserva os campos gerais do card legado (título, cores) e remove `bars`', () => {
    const legacy = {
      id: 'bar1', title: 'Vendas por Produto',
      cardBackgroundColor: '#fff', accentColor: '#4f46e5',
      bars: [{ id: 's1', label: 'A', measurePlaceholder: '[M]', color: '#f00', value: '10' }],
    };
    const migrated = migrateBarConfig(legacy);

    expect(migrated.title).toBe('Vendas por Produto');
    expect(migrated.cardBackgroundColor).toBe('#fff');
    expect(migrated.accentColor).toBe('#4f46e5');
    expect((migrated as any).bars).toBeUndefined();
  });

  it('não lança para entrada vazia/nula', () => {
    expect(() => migrateBarConfig(null)).not.toThrow();
    expect(() => migrateBarConfig(undefined)).not.toThrow();
    expect(migrateBarConfig(null).categorical).toBeDefined();
  });
});
