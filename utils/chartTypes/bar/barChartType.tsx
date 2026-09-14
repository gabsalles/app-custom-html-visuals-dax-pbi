// utils/chartTypes/bar/barChartType.tsx
//
// Fase 4, Etapa 5 — prova de conceito. Implementado seguindo só
// utils/chartTypes/README.md + as decisões fechadas na conversa (shape
// análogo a DonutSlice[], auto-escala pela maior barra via MAXX, proteção
// contra todas as barras zeradas via DIVIDE(...,...,0)).
//
// Reaproveita, sem reescrever: buildValueFormatDax/formatTestValue
// (formatação), resolveConditionalColor/buildConditionalSwitchDax
// (Fase 2, chamados por barra — ver nota em contract.ts sobre
// getConditionalTarget não cobrir multi-valor). Reaproveita visualmente as
// classes .p-track/.p-fill (preview) e .progress-track/.progress-fill
// (produção) que o tipo 'progress' já usa e já foram validadas (Fase 1/2).

import React from 'react';
import { BarChartConfig } from '../../../types';
import { ChartTypeDefinition } from '../contract';
import { buildValueFormatDax } from '../../valueFormatDax';
import { formatTestValue } from '../../formatTestValue';
import { resolveConditionalColor } from '../../conditionalFormatting';
import { buildConditionalSwitchDax } from '../../conditionalFormatting';

function daxMax(vars: string[]): string {
  // MAX() em DAX é sempre binário — encadeia pra N valores. Nenhuma
  // dependência de versão do Power BI (diferente de INDEX(), já confirmado
  // ok, mas MAX() nem precisaria dessa checagem, sempre existiu).
  return vars.reduce((acc, v) => `MAX(${acc}, ${v})`);
}

export const barChartType: ChartTypeDefinition<BarChartConfig> = {
  id: 'bar',

  // Multi-valor (N barras, N cores condicionais possíveis) — não se encaixa
  // no hook de valor único do contrato. Ver nota em contract.ts.
  getConditionalTarget: () => null,

  generateDax: (config, ctx) => {
    const { index } = ctx;
    const p = `_Bar${index}`;
    const formatSpec = {
      formatType: config.formatType || 'none',
      decimalPlaces: config.decimalPlaces || 0,
      prefix: config.prefix,
      suffix: config.suffix,
    };

    let vars = `VAR ${p}_Tit = "${config.title}"\n`;

    const rawVars = config.bars.map((bar, i) => {
      const rawVar = `${p}_S${i + 1}_Val_Raw`;
      vars += `VAR ${rawVar} = ${bar.measurePlaceholder || "0"}\n`;
      return rawVar;
    });

    // Auto-escala pela maior barra (decisão fechada). Proteção contra todas
    // zeradas: DIVIDE(...,...,0) abaixo — mesmo idioma que 'progress' já usa
    // (utils/daxGenerator.ts), não uma checagem nova inventada aqui.
    const maxVar = `${p}_Max`;
    vars += `VAR ${maxVar} = ${rawVars.length > 0 ? daxMax(rawVars) : '0'}\n`;

    let rowsHtml = '';
    config.bars.forEach((bar, i) => {
      const n = i + 1;
      const rawVar = `${p}_S${n}_Val_Raw`;
      const pctVar = `${p}_S${n}_Pct`;
      vars += `VAR ${pctVar} = MAX(0, DIVIDE(${rawVar}, ${maxVar}, 0))\n`;

      const fmt = buildValueFormatDax(rawVar, `${p}_S${n}`, formatSpec);
      vars += fmt.dax;

      const fallbackColor = bar.color || config.accentColor || '#4f46e5';
      const switchExpr = buildConditionalSwitchDax(rawVar, config.conditionalRules, `"${fallbackColor}"`);
      // Mesmo padrão do accent-bar de card (Fase 2): dinâmico só quando há
      // regra — sem overhead de SWITCH quando não precisa.
      const colorStyle = switchExpr ? `" & (${switchExpr}) & "` : fallbackColor;

      rowsHtml += `
              "<div class='bar-row' style='margin-bottom: 8px;'><div class='row-label' style='font-size: ${config.fontSizeLabel || 10}px; margin-bottom: 2px; color: ${bar.color || '#6B7280'};'>${bar.label}</div><div class='progress-track' style='height: 8px;'><div class='progress-fill' style='width: " & (${pctVar} * 100) & "%; background: ${colorStyle};'></div></div><div class='value' style='font-size: ${config.fontSizeValue || 16}px;'>" & ${fmt.valVar} & "</div></div>" & `;
    });

    const colSpan = config.colSpan || 1;
    const rowSpan = config.rowSpan || 1;
    const cardBg = config.cardBackgroundColor || '#ffffff';

    const html = `
        "<div class='v-item' style='grid-column: span ${colSpan}; grid-row: span ${rowSpan}; flex-direction: column; background: ${cardBg};'><div class='title' style='margin-bottom: 8px;'>" & ${p}_Tit & "</div>" & ` +
      rowsHtml +
      `"</div>" & `;

    return { vars, html };
  },

  renderPreview: (config, ctx) => {
    const rawValues = config.bars.map((_, i) => ctx.testValues[`${config.id}_bar_${i}`] ?? 0);
    const max = rawValues.length > 0 ? Math.max(...rawValues) : 0;
    const isSelected = ctx.selectedId === config.id;

    return (
      <div
        onClick={(e) => { e.stopPropagation(); ctx.onSelect(config.id); }}
        style={{
          gridColumn: `span ${config.colSpan || 1}`,
          gridRow: `span ${config.rowSpan || 1}`,
          background: config.cardBackgroundColor || '#ffffff',
          borderRadius: 'var(--p-radius)',
          padding: 'var(--p-pad)',
          border: isSelected ? '2px solid #4f46e5' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: config.fontSizeTitle || 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
          {config.title}
        </div>
        {config.bars.map((bar, i) => {
          const raw = rawValues[i];
          const pct = max > 0 ? Math.max(0, raw / max) : 0;
          const fallbackColor = bar.color || config.accentColor || '#4f46e5';
          const color = resolveConditionalColor(raw, config.conditionalRules, fallbackColor);
          const displayValue = formatTestValue(raw, {
            formatType: config.formatType || 'none',
            decimalPlaces: config.decimalPlaces || 0,
            prefix: config.prefix,
            suffix: config.suffix,
          });
          return (
            <div key={bar.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: config.fontSizeLabel || 10, marginBottom: 2, color: bar.color || '#6B7280' }}>{bar.label}</div>
              <div className="p-track">
                <div className="p-fill" style={{ width: `${pct * 100}%`, background: color, animation: 'none' }} />
              </div>
              <div style={{ fontSize: config.fontSizeValue || 16, fontWeight: 800 }}>{displayValue}</div>
            </div>
          );
        })}
      </div>
    );
  },
};
