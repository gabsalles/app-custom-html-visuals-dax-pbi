// utils/categoricalDax.test.ts
//
// Fase 4, Etapa 0. Testa buildSlotRankingDax/buildCategoryTableDax — o
// mecanismo de ranking isolado (Opção A INDEX(), confirmada compatível com
// Power BI Desktop 2026 do usuário; Opção B RANKX+FILTER documentada em
// comentário no próprio arquivo, pronta se algum dia precisar trocar).

import { describe, it, expect } from 'vitest';
import { buildSlotRankingDax, buildCategoryTableDax } from './categoricalDax';

describe('buildCategoryTableDax', () => {
  it('gera a tabela compartilhada categoria+valor', () => {
    const dax = buildCategoryTableDax({ varName: '_C1_CatTable', columnExpr: "'Produtos'[Categoria]", measureExpr: '[Vendas]' });
    expect(dax).toBe('VAR _C1_CatTable = ADDCOLUMNS(VALUES(\'Produtos\'[Categoria]), "@CatValue", CALCULATE([Vendas]))\n');
  });
});

describe('buildSlotRankingDax', () => {
  const opts = { tableVar: '_C1_CatTable', columnExpr: "'Produtos'[Categoria]", valueColumnExpr: '[@CatValue]', slotIndex: 3, varPrefix: '_C1_Slot3' };

  it('value_desc usa ORDERBY DESC sobre o valor', () => {
    const r = buildSlotRankingDax({ ...opts, sortBy: 'value_desc' });
    expect(r.daxVars).toContain('INDEX(3, _C1_CatTable, ORDERBY([@CatValue], DESC))');
  });

  it('value_asc usa ORDERBY ASC sobre o valor', () => {
    const r = buildSlotRankingDax({ ...opts, sortBy: 'value_asc' });
    expect(r.daxVars).toContain('INDEX(3, _C1_CatTable, ORDERBY([@CatValue], ASC))');
  });

  it("alpha usa ORDERBY ASC sobre a COLUNA, não o valor", () => {
    const r = buildSlotRankingDax({ ...opts, sortBy: 'alpha' });
    expect(r.daxVars).toContain("INDEX(3, _C1_CatTable, ORDERBY('Produtos'[Categoria], ASC))");
  });

  it('nomes de VAR de saída batem com o varPrefix', () => {
    const r = buildSlotRankingDax({ ...opts, sortBy: 'value_desc' });
    expect(r.nameVar).toBe('_C1_Slot3_Name');
    expect(r.valueVar).toBe('_C1_Slot3_Value');
  });

  it('slots diferentes geram nomes de VAR únicos (sem colisão)', () => {
    const r1 = buildSlotRankingDax({ ...opts, slotIndex: 1, varPrefix: '_C1_Slot1', sortBy: 'value_desc' });
    const r2 = buildSlotRankingDax({ ...opts, slotIndex: 2, varPrefix: '_C1_Slot2', sortBy: 'value_desc' });
    expect(r1.nameVar).not.toBe(r2.nameVar);
    expect(r1.valueVar).not.toBe(r2.valueVar);
  });
});
