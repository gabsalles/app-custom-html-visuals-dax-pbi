// utils/chartTypes/bar/barChartType.test.ts
//
// Único modo é o categórico — o modo manual (barra por barra) existiu e foi
// removido. Casos sintéticos reais (chama generateDax de verdade), aspas
// balanceadas.

import { describe, it, expect } from 'vitest';
import { barChartType } from './barChartType';
import { BarChartConfig } from '../../../types';
import { GlobalConfig } from '../../../types';

const quoteBalance = (s: string) => (s.match(/"/g) || []).length % 2 === 0;

// ─────────────────────────────────────────────────────────────────────────
// Modo categórico — 1 coluna + 1 medida, N categorias via TOPN()+CONCATENATEX()
// (troca do mecanismo INDEX()-por-slot: N agora pode vir de uma expressão
// ajustável em tempo de execução do Power BI, ver maxCategoriesMode).
// ─────────────────────────────────────────────────────────────────────────
const catGlobal = { primaryColor: '#4f46e5' } as GlobalConfig;

function categoricalBarConfig(overrides: Partial<BarChartConfig> = {}): BarChartConfig {
  return {
    id: 'bar1',
    title: 'Vendas por Categoria',
    categorical: {
      column: "'Produtos'[Categoria]",
      measurePlaceholder: '[Total Vendas]',
      maxCategoriesMode: 'fixed',
      maxCategories: 3,
      sortBy: 'value_desc',
      sortEnabled: true,
    },
    ...overrides,
  };
}

describe('barChartType.generateDax — modo categórico', () => {
  it('gera tabela categoria+valor, N fixo, TOPN e Max sobre o recorte', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(vars).toContain(`VAR _Bar1_CatTable = ADDCOLUMNS(VALUES('Produtos'[Categoria]), "@CatValue", CALCULATE([Total Vendas]))`);
    expect(vars).toContain('VAR _Bar1_MaxCategorias = 3');
    expect(vars).toContain('VAR _Bar1_TotalCategorias = COUNTROWS(_Bar1_CatTable)');
    expect(vars).toContain('VAR _Bar1_HasMore = _Bar1_TotalCategorias > _Bar1_MaxCategorias');
    expect(vars).toContain('VAR _Bar1_Top = TOPN(_Bar1_MaxCategorias, _Bar1_CatTable, [@CatValue], DESC)');
    // Max sobre o recorte (_Bar1_Top), nunca sobre a tabela inteira
    expect(vars).toContain('VAR _Bar1_Max = MAXX(_Bar1_Top, [@CatValue])');
    expect(vars).not.toMatch(/_Bar1_Max = MAXX\(_Bar1_CatTable/);
  });

  it('modo parameter usa a expressão livre do usuário em vez de um literal', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({
      categorical: { ...categoricalBarConfig().categorical!, maxCategoriesMode: 'parameter', maxCategoriesParamExpr: "SELECTEDVALUE('MaxCategorias'[MaxCategorias Value], 10)" },
    }), { global: catGlobal, index: 1 });
    expect(vars).toContain(`VAR _Bar1_MaxCategorias = SELECTEDVALUE('MaxCategorias'[MaxCategorias Value], 10)`);
    expect(vars).not.toContain('VAR _Bar1_MaxCategorias = 3');
  });

  it('modo parameter sem expressão preenchida cai pro fallback "10" (nunca gera DAX inválido)', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({
      categorical: { ...categoricalBarConfig().categorical!, maxCategoriesMode: 'parameter', maxCategoriesParamExpr: '' },
    }), { global: catGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_MaxCategorias = 10');
  });

  it('sortBy value_asc ordena TOPN por [@CatValue] ASC', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, sortBy: 'value_asc' } }), { global: catGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_Top = TOPN(_Bar1_MaxCategorias, _Bar1_CatTable, [@CatValue], ASC)');
  });

  it("sortBy alpha ordena TOPN pela COLUNA categórica, sempre ASC", () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, sortBy: 'alpha' } }), { global: catGlobal, index: 1 });
    expect(vars).toContain(`VAR _Bar1_Top = TOPN(_Bar1_MaxCategorias, _Bar1_CatTable, 'Produtos'[Categoria], ASC)`);
  });

  it('linhas via CONCATENATEX com RANKX/pct/formatação em contexto de linha', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_Rows =');
    expect(vars).toContain('CONCATENATEX(');
    expect(vars).toContain('_Bar1_Top,');
    expect(vars).toContain('VAR _RowNome = ');
    expect(vars).toContain('VAR _RowValorRaw = [@CatValue]');
    expect(vars).toContain('VAR _RowPct = MAX(0, DIVIDE(_RowValorRaw, _Bar1_Max, 0))');
    expect(vars).toContain('VAR _RowRank = RANKX(_Bar1_Top, [@CatValue], , DESC, DENSE)');
  });

  it('maxCategories <= 0 (modo fixed) cai pro fallback de 1 (nunca gera TOPN(0,...))', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, maxCategories: 0 } }), { global: catGlobal, index: 1 });
    expect(vars).toContain('VAR _Bar1_MaxCategorias = 1');
  });

  it('rodapé condicional usa _HasMore + contagem sobre a expressão de N (não um literal fixo)', () => {
    const { html } = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(html).toContain('IF(_Bar1_HasMore, "<div class=\'footer-note\'>+" & FORMAT(_Bar1_TotalCategorias - _Bar1_MaxCategorias, "#,##0")');
  });

  it('orientação horizontal (default): classes bar-cat-row/bar-track/bar-fill + --fill inline', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(vars).toContain("class='bar-cat-row'");
    expect(vars).toContain("class='bar-track'");
    expect(vars).toContain("class='bar-fill'");
    expect(vars).toContain('--fill: ');
  });

  it('orientação ranking: classes bar-row-rank/rank-badge, is-first via IF(_RowRank = 1, ...)', () => {
    const { vars } = barChartType.generateDax(categoricalBarConfig({ barOrientation: 'ranking' }), { global: catGlobal, index: 1 });
    expect(vars).toContain("class='bar-row-rank'");
    expect(vars).toContain("class='rank-badge" + '" & IF(_RowRank = 1, " is-first"');
    expect(vars).toContain("class='badge" + '" & IF(_RowRank = 1, " is-first"');
  });

  it('orientação vertical: classes v-columns/v-col/v-col-bar + eixo', () => {
    const { vars, html } = barChartType.generateDax(categoricalBarConfig({ barOrientation: 'vertical' }), { global: catGlobal, index: 1 });
    expect(html).toContain("class='v-columns bar-list'");
    expect(html).toContain("class='v-axis'");
    expect(vars).toContain("class='v-col'");
    expect(vars).toContain("class='v-col-bar'");
  });

  it('gradiente: liga background linear-gradient só quando useGradient', () => {
    const withGrad = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, useGradient: true } }), { global: catGlobal, index: 1 });
    expect(withGrad.vars).toContain('linear-gradient(90deg, #4f46e5, #4f46e599)');

    const withoutGrad = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(withoutGrad.vars).not.toContain('linear-gradient');
  });

  it('sortEnabled=true + ordenação por valor: botão + script presentes, escopados por id único', () => {
    const { html } = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 2 });
    expect(html).toContain("id='bar-chart-2'");
    expect(html).toContain("class='sort-btn'");
    expect(html).toContain('<script>');
    expect(html).toContain("getElementById('bar-chart-2')");
  });

  it('sortEnabled=false: sem botão nem script', () => {
    const { html } = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, sortEnabled: false } }), { global: catGlobal, index: 1 });
    expect(html).not.toContain('sort-btn');
    expect(html).not.toContain('<script>');
  });

  it('sortBy alpha: sem botão de ordenar mesmo com sortEnabled=true (sem direção maior/menor pra alternar)', () => {
    const { html } = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, sortBy: 'alpha', sortEnabled: true } }), { global: catGlobal, index: 1 });
    expect(html).not.toContain('sort-btn');
    expect(html).not.toContain('<script>');
  });

  it('subtitle só é concatenado quando preenchido', () => {
    const withSub = barChartType.generateDax(categoricalBarConfig({ categorical: { ...categoricalBarConfig().categorical!, subtitle: 'Últimos 30 dias' } }), { global: catGlobal, index: 1 });
    expect(withSub.vars).toContain('VAR _Bar1_Sub = "Últimos 30 dias"');
    expect(withSub.html).toContain("class='subtitle'");

    const withoutSub = barChartType.generateDax(categoricalBarConfig(), { global: catGlobal, index: 1 });
    expect(withoutSub.vars).not.toContain('_Bar1_Sub');
    expect(withoutSub.html).not.toContain("class='subtitle'");
  });

  it('aspas balanceadas nas 3 orientações, com e sem botão de ordenar, com e sem gradiente', () => {
    (['horizontal', 'ranking', 'vertical'] as const).forEach(barOrientation => {
      [true, false].forEach(sortEnabled => {
        [true, false].forEach(useGradient => {
          const { vars, html } = barChartType.generateDax(
            categoricalBarConfig({ barOrientation, categorical: { ...categoricalBarConfig().categorical!, sortEnabled, useGradient } }),
            { global: catGlobal, index: 1 }
          );
          expect(quoteBalance(vars + html)).toBe(true);
        });
      });
    });
  });

  it('getConditionalTarget continua null no modo categórico (multi-valor)', () => {
    expect(barChartType.getConditionalTarget(categoricalBarConfig())).toBeNull();
  });
});
