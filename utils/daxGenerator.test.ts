// utils/daxGenerator.test.ts
//
// Fase 4, Etapa 0: migração dos scripts de scratchpad das Fases 0.6-3 pra
// suíte permanente. Cobre a saída real de generateDAX() — mesma função
// usada em produção, sem reimplementação paralela.

import { describe, it, expect } from 'vitest';
import { generateDAX } from './daxGenerator';
import { GlobalConfig, CardConfig, DonutChartConfig, BarChartConfig, BarSlice } from '../types';

const baseGlobal: GlobalConfig = {
  columnsDesktop: 3, columnsTablet: 2, columnsMobile: 1,
  gap: 20, padding: 24, marginType: 'all', marginAll: 10,
  marginTop: 10, marginRight: 10, marginBottom: 10, marginLeft: 10,
  primaryColor: '#4f46e5', cardBackgroundColor: '#ffffff', canvasBackgroundColor: '#f3f4f6',
  textColorTitle: '#86868B', textColorValue: '#1D1D1F', textColorSub: '#6B7280',
  positiveColor: '#059669', negativeColor: '#DC2626', neutralColor: '#4B5563',
  animation: 'fadeInUp', animationDuration: 0.6, hoverEffect: 'lift',
  borderRadius: 10, cardMinHeight: 160,
  fontSizeTitle: 10, fontSizeValue: 32, fontSizeSub: 11, fontSizeBadge: 10,
  fontWeightTitle: 800, fontWeightValue: 800,
  shadowIntensity: 0, shadowBlur: 0, shadowDistance: 0, textAlign: 'left',
  dataBindings: [],
};

function baseCard(overrides: Partial<CardConfig> = {}): CardConfig {
  return {
    id: 'c1', title: 'Vendas', measurePlaceholder: '[Vendas]',
    formatType: 'currency', decimalPlaces: 0, prefix: '', suffix: '',
    type: 'simple', progressValue: 0, targetMeasurePlaceholder: '', value: '',
    icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false,
    comparisons: [],
    ...overrides,
  };
}

const quoteBalance = (dax: string) => (dax.match(/"/g) || []).length % 2 === 0;

// ─────────────────────────────────────────────────────────────
// Fase 0.6 itens 1-7 — valores de produção como fonte única
// ─────────────────────────────────────────────────────────────
describe('Fase 0.6 itens 1-7 (badge, progress bar, animação, transição)', () => {
  it('item 1: badge usa padding/radius de produção', () => {
    const dax = generateDAX(baseGlobal, [baseCard()], 'cards');
    expect(dax).toContain('padding: 3px 8px');
    expect(dax).toContain('border-radius: 6px');
  });

  it('item 3: ícone do badge usa 12px / stroke-width 2.5', () => {
    const dax = generateDAX(baseGlobal, [baseCard()], 'cards');
    expect(dax).toContain('width: 12px; height: 12px; stroke-width: 2.5');
  });

  it('item 4: altura padrão da progress bar é 8px', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ type: 'progress' })], 'cards');
    expect(dax).toMatch(/height: 8px; background:/);
  });

  it('item 5: progress bar usa radius em pílula (100px)', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ type: 'progress' })], 'cards');
    expect((dax.match(/border-radius: 100px/g) || []).length).toBe(2);
  });

  it('item 6: popIn usa curva de bounce, não a genérica antiga', () => {
    const dax = generateDAX({ ...baseGlobal, animation: 'popIn' }, [baseCard()], 'cards');
    expect(dax).toContain('cubic-bezier(0.175, 0.885, 0.32, 1.275)');
    expect(dax).not.toContain('cubic-bezier(0.2, 0.8, 0.2, 1)');
  });

  it('item 7: transição base do card usa a curva de produção', () => {
    const dax = generateDAX(baseGlobal, [baseCard()], 'cards');
    expect(dax).toContain('transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1)');
  });
});

// ─────────────────────────────────────────────────────────────
// Fase 0.6 item 8 — CardType 'ring' ausente em produção (fix isolado)
// ─────────────────────────────────────────────────────────────
describe('Fase 0.6 item 8 (ring)', () => {
  function ringCard(iconPosition: 'top' | 'left' | 'right') {
    return baseCard({
      type: 'ring', iconPosition,
      progressMeasure: '[Realizado]', progressTarget: '[Meta]', progressValue: 60,
    });
  }

  const modes: [string, number][] = [['normal', 160], ['compact', 100]];
  const positions: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];

  for (const [modeLabel, cardMinHeight] of modes) {
    for (const pos of positions) {
      it(`modo=${modeLabel} iconPos=${pos}: ring aparece só fora de compact/left`, () => {
        const dax = generateDAX({ ...baseGlobal, cardMinHeight }, [ringCard(pos)], 'cards');
        const body = dax.slice(dax.indexOf('VAR _HTML ='));
        const ringBoxCount = (body.match(/ring-box/g) || []).length;
        const expected = (modeLabel === 'compact' || pos === 'left') ? 0 : 1;
        expect(ringBoxCount).toBe(expected);
        expect(quoteBalance(dax)).toBe(true);
      });
    }
  }

  it('.ring-bg tem stroke/fill definidos (fix do disco preto)', () => {
    const dax = generateDAX(baseGlobal, [ringCard('top')], 'cards');
    expect(dax).toContain('.ring-bg { fill: transparent; stroke: #f3f4f6; stroke-width: 5; }');
  });

  it('regressão: card "progress" tradicional continua funcionando', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ type: 'progress' })], 'cards');
    expect(dax).toContain('progress-track');
    expect(dax.slice(dax.indexOf('VAR _HTML ='))).not.toContain('ring-box');
  });

  it('regressão: card "simple" não declara _Prog_Pct à toa', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ type: 'simple' })], 'cards');
    expect(dax).not.toContain('VAR _C1_Prog_Pct');
  });
});

// ─────────────────────────────────────────────────────────────
// Ícones do badge (bar/dot/star/alert) — fix isolado pós item 8
// ─────────────────────────────────────────────────────────────
describe('Ícones do badge (bar/dot/star/alert)', () => {
  function cardWithIcon(iconType: string) {
    return baseCard({
      comparisons: [{ id: 'cp1', label: 'MoM', value: '', trend: 'up', logic: 'true', measurePlaceholder: '[D]', displayMode: 'trend+value', iconType: iconType as any }],
    });
  }

  const TRENDING_UP_PATH = 'M23 6l-9.5 9.5-5-5L1 18';

  for (const iconType of ['bar', 'dot', 'star', 'alert']) {
    it(`${iconType} não cai mais no fallback de seta de tendência`, () => {
      const dax = generateDAX(baseGlobal, [cardWithIcon(iconType)], 'cards');
      expect(dax).not.toContain(TRENDING_UP_PATH);
      expect(quoteBalance(dax)).toBe(true);
    });
  }

  it('os 4 tipos geram paths distintos entre si', () => {
    const paths = ['bar', 'dot', 'star', 'alert'].map(t => {
      const dax = generateDAX(baseGlobal, [cardWithIcon(t)], 'cards');
      const m = dax.match(/path d='" & IF\(_C1_Comp1_Log, "([^"]+)", "([^"]+)"\)/);
      return m ? m[1] : null;
    });
    expect(new Set(paths).size).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────
// Fase 1 item 2 — overflow de título (min-width/max-width, sem flex-shrink:0)
// ─────────────────────────────────────────────────────────────
describe('Fase 1 item 2 (.title overflow protection)', () => {
  const modes: [string, number][] = [['normal', 160], ['compact', 100]];
  const positions: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];

  for (const [modeLabel, cardMinHeight] of modes) {
    for (const pos of positions) {
      it(`modo=${modeLabel} iconPos=${pos}: .title protegida corretamente`, () => {
        const dax = generateDAX({ ...baseGlobal, cardMinHeight }, [baseCard({ iconPosition: pos })], 'cards');
        const titleRule = (dax.match(/\.title \{[^}]*\}/) || [''])[0];
        expect(titleRule).toContain('min-width: 0');
        expect(titleRule).toContain('max-width: 100%');
        expect(titleRule).not.toContain('flex-shrink: 0');
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// Fase 1 item 3 — testes de pior caso
// ─────────────────────────────────────────────────────────────
describe('Fase 1 item 3 (pior caso)', () => {
  it('valor longo: gera DAX válido (proteção real coberta em "Fase 1 fechamento" abaixo)', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ prefix: 'R$ ', decimalPlaces: 2 })], 'cards');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('5 comparativos: todos são gerados, sem truncar a quantidade', () => {
    const comps = [1, 2, 3, 4, 5].map(n => ({
      id: `cp${n}`, label: `Comp ${n}`, value: '', trend: 'up' as const, logic: 'true', measurePlaceholder: `[D${n}]`,
    }));
    const dax = generateDAX(baseGlobal, [baseCard({ comparisons: comps })], 'cards');
    expect((dax.match(/class='row'/g) || []).length).toBe(5);
  });

  it('título e valor vazios: gera sem exceção, DAX válido', () => {
    expect(() => {
      const dax = generateDAX(baseGlobal, [baseCard({ title: '', measurePlaceholder: '' })], 'cards');
      expect(dax).toContain('VAR _C1_Tit = ""');
      expect(quoteBalance(dax)).toBe(true);
    }).not.toThrow();
  });

  it('card mínimo (colSpan=1) gera sem erro', () => {
    const dax = generateDAX({ ...baseGlobal, columnsDesktop: 6, fontSizeValue: 48 }, [baseCard({ colSpan: 1, rowSpan: 1 })], 'cards');
    expect(dax).toContain('grid-column: span 1');
  });
});

// ─────────────────────────────────────────────────────────────
// Fase 1 (fechamento) — overflow do .value: quebra de linha em vez de corte
// ─────────────────────────────────────────────────────────────
describe('Fase 1 fechamento (.value wrap)', () => {
  for (const [modeLabel, cardMinHeight] of [['normal', 160], ['compact', 100]] as [string, number][]) {
    it(`modo=${modeLabel}: .value usa white-space:normal + overflow-wrap`, () => {
      const dax = generateDAX({ ...baseGlobal, cardMinHeight }, [baseCard()], 'cards');
      const valueRule = (dax.match(/\.value \{[^}]*\}/) || [''])[0];
      expect(valueRule).toContain('white-space: normal');
      expect(valueRule).toContain('overflow-wrap: break-word');
      expect(valueRule).not.toContain('nowrap');
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Fase 1 item 4 — labelColor
// ─────────────────────────────────────────────────────────────
describe('Fase 1 item 4 (labelColor)', () => {
  function customCard(labelColor?: string) {
    return baseCard({
      comparisons: [{ id: 'cp1', label: 'NPS', value: '', trend: 'up', logic: 'true', measurePlaceholder: '[D]', displayMode: 'custom', iconType: 'trending', labelColor }],
    });
  }

  it('com labelColor: badge usa cor fixa, sem IF() de trend', () => {
    const dax = generateDAX(baseGlobal, [customCard('#7c3aed')], 'cards');
    expect(dax).toContain('color: #7c3aed; background-color: #7c3aed1A;');
    expect(dax).not.toContain('color: " & IF(_C1_Comp1_Log');
    expect(dax).toContain("class='row-label' style='color: #7c3aed'");
    expect(quoteBalance(dax)).toBe(true);
  });

  it('sem labelColor: comportamento antigo preservado (IF de trend, textColorSub)', () => {
    const dax = generateDAX(baseGlobal, [customCard(undefined)], 'cards');
    expect(dax).toContain('color: " & IF(_C1_Comp1_Log');
    expect(dax).toContain(`class='row-label' style='color: ${baseGlobal.textColorSub}'`);
    expect(quoteBalance(dax)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Regressão combinada Fase 1: título longo + labelColor no mesmo card
// ─────────────────────────────────────────────────────────────
describe('Regressão combinada: título longo + labelColor (itens 2 e 4)', () => {
  const LONG_TITLE = 'Receita Consolidada Trimestral de Todas as Unidades de Negócio da Região Sudeste e Nordeste Combinadas';
  const LABEL_COLOR = '#7c3aed';

  function combinedCard(iconPosition: 'top' | 'left' | 'right') {
    return baseCard({
      title: LONG_TITLE, iconPosition,
      comparisons: [{ id: 'cp1', label: 'NPS Trimestral', value: '', trend: 'up', logic: 'true', measurePlaceholder: '[D]', displayMode: 'custom', iconType: 'trending', labelColor: LABEL_COLOR }],
    });
  }

  for (const [modeLabel, cardMinHeight] of [['normal', 160], ['compact', 100]] as [string, number][]) {
    for (const pos of ['top', 'left', 'right'] as const) {
      it(`modo=${modeLabel} iconPos=${pos}: as duas correções coexistem sem colisão`, () => {
        const dax = generateDAX({ ...baseGlobal, cardMinHeight }, [combinedCard(pos)], 'cards');
        const titleRule = (dax.match(/\.title \{[^}]*\}/) || [''])[0];
        expect(titleRule).toContain('min-width: 0');
        expect(titleRule).toContain('max-width: 100%');
        expect(dax).toContain(LONG_TITLE);
        expect(dax).toContain(`style='color: ${LABEL_COLOR}; background-color: ${LABEL_COLOR}1A;'`);
        // ícone de tendência continua condicional (não deve sumir por causa do labelColor)
        expect(dax).toContain(`path d='" & IF(_C1_Comp1_Log, "M23 6l-9.5 9.5-5-5L1 18", "M23 18l-9.5-9.5-5 5L1 6") & "'`);
        expect(quoteBalance(dax)).toBe(true);
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// Ring + formatação condicional combinados (sem colisão com Prog_Pct/ringHTML)
// ─────────────────────────────────────────────────────────────
describe('Ring + conditionalRules combinados', () => {
  const rules = [
    { id: 'r1', operator: '<' as const, value: 100, color: '#dc2626' },
    { id: 'r2', operator: '>=' as const, value: 100, color: '#059669' },
  ];

  function ringCardWithRules(iconPosition: 'top' | 'left' | 'right') {
    return baseCard({
      type: 'ring', iconPosition,
      progressMeasure: '[Realizado]', progressTarget: '[Meta]', progressValue: 60,
      conditionalRules: rules,
    });
  }

  for (const [modeLabel, cardMinHeight, ringExpected] of [['normal', 160, true], ['compact', 100, false]] as [string, number, boolean][]) {
    for (const pos of ['top', 'left', 'right'] as const) {
      it(`modo=${modeLabel} iconPos=${pos}: accent-bar condicional e ring coexistem`, () => {
        const dax = generateDAX({ ...baseGlobal, cardMinHeight }, [ringCardWithRules(pos)], 'cards');
        expect(dax).toContain('--accent-bar: " & (SWITCH(TRUE(),');
        expect(dax).toContain('_C1_Val_Raw < 100, "#dc2626"');
        expect(dax).toContain('VAR _C1_Prog_Pct = MIN(1, MAX(0, DIVIDE(_C1_Prog_Val, _C1_Prog_Tgt, 0)))');
        const body = dax.slice(dax.indexOf('VAR _HTML ='));
        const ringBoxCount = (body.match(/ring-box/g) || []).length;
        const expected = (!ringExpected || pos === 'left') ? 0 : 1;
        expect(ringBoxCount).toBe(expected);
        expect(quoteBalance(dax)).toBe(true);
      });
    }
  }
});

// ─────────────────────────────────────────────────────────────
// Fase 2 — formatação condicional (accent bar)
// ─────────────────────────────────────────────────────────────
describe('Fase 2 (formatação condicional)', () => {
  it('sem regras: accent-bar estática, sem SWITCH, sem overhead de VAR', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ accentColor: '#4f46e5' })], 'cards');
    expect(dax).toContain('--accent-bar: #4f46e5;');
    expect(dax).not.toContain('SWITCH(TRUE()');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('com regras: SWITCH correto, ordem = primeira que casa vence, fallback no final', () => {
    const rules = [
      { id: 'r1', operator: '<' as const, value: 100, color: '#dc2626' },
      { id: 'r2', operator: '<' as const, value: 500, color: '#f59e0b' },
      { id: 'r3', operator: '>=' as const, value: 500, color: '#059669' },
    ];
    const dax = generateDAX(baseGlobal, [baseCard({ accentColor: '#4f46e5', conditionalRules: rules })], 'cards');
    expect(dax).toContain('SWITCH(TRUE(),');
    expect(dax).toContain('_C1_Val_Raw < 100, "#dc2626"');
    expect(dax).toContain('_C1_Val_Raw < 500, "#f59e0b"');
    expect(dax).toContain('_C1_Val_Raw >= 500, "#059669"');
    expect(dax).toContain(', "#059669", "#4f46e5")');
    expect(quoteBalance(dax)).toBe(true);
  });

  it("operador 'between' usa AND()", () => {
    const dax = generateDAX(baseGlobal, [baseCard({ conditionalRules: [{ id: 'r1', operator: 'between', value: 100, value2: 200, color: '#f59e0b' }] })], 'cards');
    expect(dax).toContain('AND(_C1_Val_Raw >= 100, _C1_Val_Raw <= 200)');
  });

  it('regressão: donut mantém accent-bar estática (classe .v-item compartilhada)', () => {
    const donut: DonutChartConfig = {
      id: 'd1', title: 'Meta', mode: 'completeness', geometry: 'full', accentColor: '#22c55e',
      ringThickness: 12, roundedCorners: true, showCenterText: false, centerTextLabel: '', centerTextValueMeasure: '',
      completenessMeasure: '[Vendas]', completenessTarget: '[Meta]', slices: [], colSpan: 1, rowSpan: 1,
    };
    const dax = generateDAX(baseGlobal, [donut], 'donuts');
    expect(dax).toContain('--accent-bar: #22c55e;');
    expect(dax).not.toContain('SWITCH(TRUE()');
  });
});

// ─────────────────────────────────────────────────────────────
// Fase 3 etapa 3 — motor de geração categórica
// ─────────────────────────────────────────────────────────────
describe('Fase 3 (motor categórico)', () => {
  function catCard(overrides: Partial<CardConfig> = {}) {
    return baseCard({
      title: 'Vendas por Região', accentColor: '#4f46e5',
      categorical: { column: "'Regiao'[Nome]", maxSlots: 5, showOthersBucket: true, sortBy: 'value_desc', columns: 3 },
      ...overrides,
    });
  }

  it('estrutura básica: tabela compartilhada + 5 blocos INDEX + Outros', () => {
    const dax = generateDAX(baseGlobal, [catCard()], 'cards');
    expect(dax).toContain("VAR _C1_CatTable = ADDCOLUMNS(VALUES('Regiao'[Nome]), \"@CatValue\", CALCULATE([Vendas]))");
    for (let n = 1; n <= 5; n++) {
      expect(dax).toContain(`VAR _C1_Slot${n}_Row = INDEX(${n}, _C1_CatTable, ORDERBY([@CatValue], DESC))`);
    }
    expect(dax).toContain('VAR _C1_TotalAll');
    expect(dax).toContain('VAR _C1_TopNSum = _C1_Slot1_Value + _C1_Slot2_Value + _C1_Slot3_Value + _C1_Slot4_Value + _C1_Slot5_Value');
    expect(dax).toContain('VAR _C1_HasOthers');
    expect(dax).toContain('grid-template-columns:repeat(3, 1fr)');
    expect(dax).toContain('📊 Grupo: Vendas por Região (5+Outros cards)');
    expect((dax.match(/class='v-item' style/g) || []).length).toBe(6); // 5 slots + Outros
    expect(quoteBalance(dax)).toBe(true);
  });

  it('sem Outros + ordenação alfabética', () => {
    const dax = generateDAX(baseGlobal, [catCard({
      categorical: { column: "'Regiao'[Nome]", maxSlots: 4, showOthersBucket: false, sortBy: 'alpha', columns: 2 },
    })], 'cards');
    expect((dax.match(/class='v-item' style/g) || []).length).toBe(4);
    expect(dax).toContain("ORDERBY('Regiao'[Nome], ASC)");
    expect(dax).not.toContain('_C1_HasOthers');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('formatação condicional por slot usa o valor do PRÓPRIO slot, não do card', () => {
    const rules = [
      { id: 'r1', operator: '<' as const, value: 1000, color: '#dc2626' },
      { id: 'r2', operator: '>=' as const, value: 1000, color: '#059669' },
    ];
    const dax = generateDAX(baseGlobal, [catCard({ conditionalRules: rules })], 'cards');
    expect(dax).toContain('SWITCH(TRUE(), _C1_Slot1_Value < 1000, "#dc2626", _C1_Slot1_Value >= 1000, "#059669"');
    // Outros não herda condicional — só 5 SWITCHes (um por slot normal), não 6
    expect((dax.match(/SWITCH\(TRUE\(\)/g) || []).length).toBe(5);
    expect(quoteBalance(dax)).toBe(true);
  });

  it('categórico ignora card.type por design — sem Prog_Pct mesmo com type=ring', () => {
    // Decisão da etapa 3: slots categóricos são sempre simples (ícone+título+valor),
    // sem header-position/ring/progress — categorical.return acontece ANTES do check
    // de type no loop de VARs, então type fica irrelevante nesse modo. Isso é
    // intencional, não uma lacuna — registrado aqui pra não virar regressão silenciosa
    // se algum dia decidirmos que type deveria importar em modo categórico.
    const dax = generateDAX(baseGlobal, [catCard({
      type: 'ring', progressMeasure: '[Realizado]', progressTarget: '[Meta]', progressValue: 60,
      conditionalRules: [{ id: 'r1', operator: '>=', value: 0, color: '#4f46e5' }],
    })], 'cards');
    expect(dax).toContain('VAR _C1_CatTable');
    expect(dax).not.toContain('VAR _C1_Prog_Pct');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('regressão: card normal (não categórico) continua idêntico', () => {
    const dax = generateDAX(baseGlobal, [baseCard()], 'cards');
    expect(dax).toContain('VAR _C1_Val_Raw = [Vendas]');
    expect(dax).not.toContain('CatTable');
    expect(dax).not.toContain('_Slot');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('mistura: card normal + categórico juntos, índices ci corretos', () => {
    const dax = generateDAX(baseGlobal, [baseCard({ id: 'c1' }), catCard({ id: 'c2' })], 'cards');
    expect(dax).toContain('VAR _C1_Val_Raw = [Vendas]');
    expect(dax).toContain('VAR _C2_CatTable');
    expect(quoteBalance(dax)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Fase 4, Etapa 5 — despacho puro pra 'bars' em generateDAX()
//
// Isto NÃO reexplica a lógica de barra (já coberta em
// utils/chartTypes/bar/barChartType.test.ts) — o objetivo aqui é só provar
// que o branch tab === 'bars' dentro de daxGenerator.ts é despacho puro:
// concatena VAR/HTML vindos de chartTypeRegistry.bar.generateDax() sem
// reescrever nada, com índice 1-based correto e sem regressão nos outros
// dois branches (cards/donuts).
function baseBarSlice(overrides: Partial<BarSlice> = {}): BarSlice {
  return { id: 'b1', label: 'Categoria 1', measurePlaceholder: '[Vendas]', color: '#4f46e5', value: '0', ...overrides };
}

function baseBarChart(overrides: Partial<BarChartConfig> = {}): BarChartConfig {
  return {
    id: 'bar1', title: 'Vendas por Categoria',
    bars: [baseBarSlice({ id: 'b1', label: 'Cat 1' }), baseBarSlice({ id: 'b2', label: 'Cat 2', measurePlaceholder: '[Custo]' })],
    ...overrides,
  };
}

describe("Fase 4, Etapa 5 (despacho puro tab === 'bars')", () => {
  it('gera DAX válido (aspas balanceadas) pra 1 gráfico de barras', () => {
    const dax = generateDAX(baseGlobal, [baseBarChart()], 'bars');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('usa o mesmo motor de chartTypeRegistry.bar.generateDax (VAR _Bar1_* presentes)', () => {
    const dax = generateDAX(baseGlobal, [baseBarChart()], 'bars');
    expect(dax).toContain('VAR _Bar1_Tit = "Vendas por Categoria"');
    expect(dax).toContain('VAR _Bar1_S1_Val_Raw = [Vendas]');
    expect(dax).toContain('VAR _Bar1_S2_Val_Raw = [Custo]');
    expect(dax).toContain('VAR _Bar1_Max = MAX(_Bar1_S1_Val_Raw, _Bar1_S2_Val_Raw)');
  });

  it('índice 1-based correto pra múltiplos gráficos de barras (_Bar1_/_Bar2_)', () => {
    const dax = generateDAX(baseGlobal, [baseBarChart({ id: 'bar1' }), baseBarChart({ id: 'bar2', title: 'Outro Gráfico' })], 'bars');
    expect(dax).toContain('VAR _Bar1_Tit = "Vendas por Categoria"');
    expect(dax).toContain('VAR _Bar2_Tit = "Outro Gráfico"');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('lista vazia de barras não quebra (items = [])', () => {
    const dax = generateDAX(baseGlobal, [], 'bars');
    expect(quoteBalance(dax)).toBe(true);
    expect(dax).not.toContain('VAR _Bar1_');
  });

  it('regressão: tab cards continua sem nenhum vestígio de _Bar (dispatch não vaza entre abas)', () => {
    const dax = generateDAX(baseGlobal, [baseCard()], 'cards');
    expect(dax).not.toContain('_Bar');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('regressão: tab donuts continua sem nenhum vestígio de _Bar', () => {
    const donut: DonutChartConfig = {
      id: 'd1', title: 'Meta', mode: 'completeness', geometry: 'full',
      completenessMeasure: '[Vendas]', completenessTarget: '[Meta]',
      slices: [], showCenterText: false, previewPercent: 50,
    } as DonutChartConfig;
    const dax = generateDAX(baseGlobal, [donut], 'donuts');
    expect(dax).not.toContain('_Bar');
    expect(quoteBalance(dax)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// Fix do gauge — chartSize/sizePct não crescia acima de um teto fixo
// desconectado do input (bug reportado com evidência visual: "escala do
// gauge não cresce após 100%, sobra de espaço e input com valor inválido").
// Cobre o lado produção (daxGenerator.ts) — a mesma matemática (gaugeMath.ts)
// é a fonte usada por Preview.tsx, testada em gaugeMath.test.ts; aqui só
// confirma que daxGenerator.ts de fato usa essas funções, não uma cópia.
// ─────────────────────────────────────────────────────────────
describe('Fix do gauge (chartSize sem teto conectado ao input)', () => {
  function baseGaugeDonut(overrides: Partial<DonutChartConfig> = {}): DonutChartConfig {
    return {
      id: 'd1', title: 'Meta', mode: 'completeness', geometry: 'semicircle',
      ringThickness: 12, roundedCorners: true, showCenterText: true,
      centerTextLabel: 'KPI', centerTextValueMeasure: '[Valor]',
      completenessMeasure: '[Vendas]', completenessTarget: '[Meta]',
      slices: [], colSpan: 1, rowSpan: 1, previewPercent: 70,
      ...overrides,
    };
  }

  it('semicírculo: max-height não é mais o fixo "60%" desconectado do input', () => {
    const dax = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 90 })], 'donuts');
    expect(dax).not.toContain("max-height: 60%");
    expect(dax).toContain('max-height: 100%');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('semicírculo (round 2): usa aspect-ratio + viewBox recortado, não mais height em % fixo', () => {
    const dax = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 90, ringThickness: 12 })], 'donuts');
    // Mesma proporção calculada em gaugeMath.ts — zero letterbox por construção.
    expect(dax).toContain('aspect-ratio: 92 / 52');
    expect(dax).toContain("viewBox='4 4 92 52'");
    // height agora é 'auto' (o browser deriva a partir do aspect-ratio), não
    // mais uma % calculada à mão que podia sobrar em cards altos/estreitos.
    expect(dax).toContain('height: auto');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('semicírculo: largura da caixa (a dimensão que sizePct de fato controla) cresce com sizePct', () => {
    const daxSmall = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 30 })], 'donuts');
    const daxBig   = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 100 })], 'donuts');
    const extractWidth = (dax: string) => {
      const m = dax.match(/width: ([\d.]+)%; max-width: 100%; max-height: 100%; aspect-ratio/);
      return m ? parseFloat(m[1]) : NaN;
    };
    expect(extractWidth(daxSmall)).toBe(30);
    expect(extractWidth(daxBig)).toBe(100);
  });

  it('semicírculo: centerTop é sempre 50% (relativo ao wrapper da caixa, não mais um "65%"/fórmula calibrada)', () => {
    const daxSmall = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 30 })], 'donuts');
    const daxBig   = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 100 })], 'donuts');
    const extractTop = (dax: string) => {
      const m = dax.match(/top: ([\d.]+)%; left: 50%/);
      return m ? parseFloat(m[1]) : NaN;
    };
    expect(extractTop(daxSmall)).toBe(50);
    expect(extractTop(daxBig)).toBe(50);
  });

  it('semicírculo: geometria (viewBox/aspect-ratio) reage à espessura do anel (ringThickness)', () => {
    const daxThin  = generateDAX(baseGlobal, [baseGaugeDonut({ ringThickness: 4 })], 'donuts');
    const daxThick = generateDAX(baseGlobal, [baseGaugeDonut({ ringThickness: 40 })], 'donuts');
    expect(daxThin).toContain("viewBox='8 8 84 44'");     // min=50-40-4/2=8, width=2*40+4=84, height=40+4=44
    expect(daxThick).toContain('aspect-ratio: 120 / 80'); // width=2*40+40=120, height=40+40=80
    expect(quoteBalance(daxThin)).toBe(true);
    expect(quoteBalance(daxThick)).toBe(true);
  });

  it('círculo cheio (geometry: full) continua com width/height=sizePct% e centerTop=50% (sem regressão, sem aspect-ratio)', () => {
    const dax = generateDAX(baseGlobal, [baseGaugeDonut({ geometry: 'full', chartSize: 90 })], 'donuts');
    expect(dax).toContain('width: 90%; height: 90%; max-width: 100%; max-height: 100%');
    expect(dax).toContain('top: 50%; left: 50%');
    expect(dax).not.toContain('aspect-ratio');
  });

  it('chartSize fora da faixa (ex.: 901010101, valor inválido do bug reportado) é clampado pra 100 na saída', () => {
    const dax = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: 901010101 })], 'donuts');
    expect(dax).toContain('width: 100%');
    expect(dax).not.toContain('901010101');
    expect(quoteBalance(dax)).toBe(true);
  });

  it('chartSize negativo/zero é clampado pro piso (não gera width negativo)', () => {
    const dax = generateDAX(baseGlobal, [baseGaugeDonut({ chartSize: -50 })], 'donuts');
    expect(dax).not.toContain('width: -50%');
    expect(quoteBalance(dax)).toBe(true);
  });
});
