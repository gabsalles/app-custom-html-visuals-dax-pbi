// utils/chartTypes/bar/barChartType.tsx
//
// Gráfico de barras — modo único: 1 coluna categórica + 1 medida, N
// categorias descobertas via DAX (ADDCOLUMNS(VALUES())+TOPN()+CONCATENATEX()+
// RANKX()), com N fixo ou ajustável em tempo de execução via expressão livre
// (What-if Parameter do Power BI). Existiu um modo manual (barra por barra,
// BarSlice[]) — removido a pedido explícito; este arquivo só tem o categórico.

import React, { useState, useEffect } from 'react';
import { BarChartConfig } from '../../../types';
import { ChartTypeDefinition, ChartDaxContext, ChartPreviewContext, DaxFragment } from '../contract';
import { getFormatString } from '../../valueFormatDax';
import { formatTestValue } from '../../formatTestValue';
import { buildCategoryTableDax } from '../../categoricalDax';

/** Uma "peça" da expressão DAX de concatenação: texto literal (citado) ou uma
 * expressão bare (VAR/IF/etc.) — junta tudo com ' & ' no fim. Generaliza, sem
 * mudar, o idioma manual `"..." & VAR & "..."` já usado no resto do arquivo. */
function lit(html: string): string {
  return `"${html}"`;
}

/** Expressão DAX (não uma linha `VAR ...`) que formata um valor bruto —
 * mesma lógica de buildValueFormatDax()/getFormatString(), mas utilizável
 * dentro de um bloco VAR/RETURN de linha (CONCATENATEX), que não pode conter
 * uma declaração VAR solta no meio. */
function inlineValueFormatExpr(rawExpr: string, spec: { formatType: string; decimalPlaces: number; prefix?: string; suffix?: string }): string {
  if (spec.formatType === 'none') {
    return `"${spec.prefix || ''}" & ${rawExpr} & "${spec.suffix || ''}"`;
  }
  if (spec.formatType === 'short' || spec.formatType === 'currency_short') {
    const zeros = spec.decimalPlaces > 0 ? "." + "0".repeat(spec.decimalPlaces) : "";
    const shortFmt = `#,0${zeros}`;
    const baseFmt = `#,##0${zeros}`;
    const prefix = spec.formatType === 'currency_short' ? "R$ " : (spec.prefix || "");
    return `VAR _FmtAbs = ABS(${rawExpr}) VAR _FmtDyn = SWITCH(TRUE(), _FmtAbs >= 1000000000, FORMAT(DIVIDE(${rawExpr}, 1000000000), "${shortFmt}") & " B", _FmtAbs >= 1000000, FORMAT(DIVIDE(${rawExpr}, 1000000), "${shortFmt}") & " M", _FmtAbs >= 1000, FORMAT(DIVIDE(${rawExpr}, 1000), "${shortFmt}") & " K", FORMAT(${rawExpr}, "${baseFmt}")) RETURN "${prefix}" & _FmtDyn & "${spec.suffix || ''}"`;
  }
  const formatStr = getFormatString(spec.formatType, spec.decimalPlaces);
  const explicitPrefix = spec.formatType === 'currency' ? (spec.prefix || "R$ ") : (spec.prefix || "");
  return `"${explicitPrefix}" & FORMAT(${rawExpr}, "${formatStr}") & "${spec.suffix || ''}"`;
}

function generateCategoricalBarDax(config: BarChartConfig, ctx: ChartDaxContext): DaxFragment {
  const { index, global } = ctx;
  const p = `_Bar${index}`;
  const cat = config.categorical!;
  const orientation = config.barOrientation || 'horizontal';
  const columnExpr = cat.column || '""';
  const accent = config.accentColor || global.primaryColor;
  const cardBg = config.cardBackgroundColor || global.cardBackgroundColor || '#ffffff';
  const colSpan = config.colSpan || 1;
  const rowSpan = config.rowSpan || 1;
  const formatSpec = {
    formatType: config.formatType || 'none',
    decimalPlaces: config.decimalPlaces || 0,
    prefix: config.prefix,
    suffix: config.suffix,
  };

  // Ordenação: reaproveita o mesmo enum dos cards categóricos (CategoricalSortBy).
  // 'alpha' ordena pela COLUNA categórica (não pela medida) — cobre alfabética
  // E cronológica de graça, se a coluna for um tipo data de verdade no modelo
  // (mesma ressalva já documentada em categoricalDax.ts sobre RANKX não ter
  // um modo nativo de ranking alfabético — se a orientação 'ranking' for
  // combinada com sortBy='alpha', o número do badge usa a mesma expressão de
  // ordenação da coluna, sem garantia formal de "posição alfabética" pelo RANKX).
  const isAlpha = cat.sortBy === 'alpha';
  const orderByExpr = isAlpha ? columnExpr : '[@CatValue]';
  const orderDir = isAlpha ? 'ASC' : (cat.sortBy === 'value_asc' ? 'ASC' : 'DESC');

  const tableVar = `${p}_CatTable`;
  const maxCatVar = `${p}_MaxCategorias`;
  const topVar = `${p}_Top`;

  let vars = buildCategoryTableDax({ varName: tableVar, columnExpr, measureExpr: cat.measurePlaceholder || "0" });
  vars += `VAR ${p}_Tit = "${config.title}"\n`;
  if (cat.subtitle) {
    vars += `VAR ${p}_Sub = "${cat.subtitle}"\n`;
  }
  // N: literal (modo 'fixed') ou uma expressão que o usuário cola depois de
  // criar um What-if Parameter no Power BI Desktop (modo 'parameter') — o
  // app só gera texto DAX, não cria o parâmetro; ver painel do Editor.
  const maxCatExpr = cat.maxCategoriesMode === 'parameter'
    ? (cat.maxCategoriesParamExpr || '10')
    : String(Math.max(1, cat.maxCategories ?? 10));
  vars += `VAR ${maxCatVar} = ${maxCatExpr}\n`;
  vars += `VAR ${p}_TotalCategorias = COUNTROWS(${tableVar})\n`;
  vars += `VAR ${p}_HasMore = ${p}_TotalCategorias > ${maxCatVar}\n`;
  vars += `VAR ${topVar} = TOPN(${maxCatVar}, ${tableVar}, ${orderByExpr}, ${orderDir})\n`;
  // Máximo calculado só sobre o recorte exibido (Top-N), nunca sobre a tabela
  // inteira — senão a barra mais alta do recorte pode não bater 100%.
  vars += `VAR ${p}_Max = MAXX(${topVar}, [@CatValue])\n`;

  const gradW = cat.useGradient ? `linear-gradient(90deg, ${accent}, ${accent}99)` : accent;
  const gradV = cat.useGradient ? `linear-gradient(0deg, ${accent}, ${accent}99)` : accent;

  let rowBodyExpr: string;
  if (orientation === 'ranking') {
    rowBodyExpr = `"<div class='bar-row-rank' data-value='" & _RowRawStr & "'><div class='rank-badge" & IF(_RowRank = 1, " is-first", "") & "'>" & _RowRank & "</div><div class='rank-label'>" & _RowNome & "</div><span class='badge" & IF(_RowRank = 1, " is-first", "") & "'>" & _RowValFmt & "</span></div>"`;
  } else if (orientation === 'vertical') {
    rowBodyExpr = `"<div class='v-col' data-value='" & _RowRawStr & "'><div class='v-col-value'>" & _RowValFmt & "</div><div class='v-col-bar' style='--fill: " & (_RowPct * 100) & "%; background: ${gradV};'></div><div class='v-col-label'>" & _RowNome & "</div></div>"`;
  } else {
    rowBodyExpr = `"<div class='bar-cat-row' data-value='" & _RowRawStr & "'><div class='bar-label'>" & _RowNome & "</div><div class='bar-track'><div class='bar-fill' style='--fill: " & (_RowPct * 100) & "%; background: ${gradW};'></div></div><div class='bar-value'>" & _RowValFmt & "</div></div>"`;
  }

  // CONCATENATEX substitui as N VARs nomeadas (_Slot1.._SlotN) de antes — só
  // assim dá pra ter N decidido em tempo de execução do Power BI (item 5):
  // uma expressão VAR/RETURN por linha, avaliada em contexto de linha pelo
  // próprio CONCATENATEX, sem precisar de um nome de VAR fixo por posição.
  vars += `VAR ${p}_Rows =
    CONCATENATEX(
        ${topVar},
        VAR _RowNome = ${columnExpr}
        VAR _RowValorRaw = [@CatValue]
        VAR _RowPct = MAX(0, DIVIDE(_RowValorRaw, ${p}_Max, 0))
        VAR _RowRank = RANKX(${topVar}, ${orderByExpr}, , ${orderDir}, DENSE)
        VAR _RowValFmt = ${inlineValueFormatExpr('_RowValorRaw', formatSpec)}
        VAR _RowRawStr = FORMAT(_RowValorRaw, "0.##############")
        RETURN ${rowBodyExpr},
        "",
        ${orderByExpr}, ${orderDir}
    )
`;

  const rootId = `bar-chart-${index}`;
  const sortLabelDesc = 'Maior→menor';
  const sortLabelAsc = 'Menor→maior';
  // Alfabética/cronológica não tem uma direção "maior/menor" pra alternar —
  // o botão só existe pras duas ordenações por valor.
  const canToggleSort = !isAlpha;
  const initialDir = cat.sortBy === 'value_asc' ? 'asc' : 'desc';
  const sortButtonHtml = (cat.sortEnabled && canToggleSort)
    ? `<button class='sort-btn' type='button' data-dir='${initialDir}'><svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round'><path d='M3 6h10M3 12h7M3 18h4M17 4v16m0 0l-4-4m4 4l4-4'/></svg><span class='sort-btn-label'>${initialDir === 'asc' ? sortLabelAsc : sortLabelDesc}</span></button>`
    : '';

  // Script inline, escopado por rootId — reordena os nós já renderizados no
  // clique (dado estático, sem nova consulta DAX; Power BI não permite isso).
  // Não dá pra confirmar por aqui se o visual "HTML Content" executa <script>
  // vindo de uma medida — se não executar, o botão fica só sem clique, a
  // ordem inicial (definida na geração) já sai correta.
  const sortScriptHtml = (cat.sortEnabled && canToggleSort) ? `<script>(function(){
var root=document.getElementById('${rootId}');
if(!root)return;
var btn=root.querySelector('.sort-btn');
var list=root.querySelector('.bar-list');
if(!btn||!list)return;
btn.addEventListener('click',function(){
var dir=btn.getAttribute('data-dir')==='asc'?'desc':'asc';
btn.setAttribute('data-dir',dir);
var items=Array.prototype.slice.call(list.children);
items.sort(function(a,b){
var va=parseFloat(a.getAttribute('data-value'))||0;
var vb=parseFloat(b.getAttribute('data-value'))||0;
return dir==='asc'?va-vb:vb-va;
});
items.forEach(function(el,i){
list.appendChild(el);
var badge=el.querySelector('.rank-badge');
if(badge){badge.textContent=String(i+1);badge.classList.toggle('is-first',i===0);}
var pill=el.querySelector('.badge');
if(pill){pill.classList.toggle('is-first',i===0);}
});
var lbl=btn.querySelector('.sort-btn-label');
if(lbl){lbl.textContent=dir==='asc'?'${sortLabelAsc}':'${sortLabelDesc}';}
});
})();</script>` : '';

  const listOpenClass = orientation === 'vertical' ? 'v-columns bar-list' : 'bar-list';
  const listClose = orientation === 'vertical' ? `</div><div class='v-axis'></div>` : `</div>`;

  const parts: string[] = [];
  parts.push(lit(`<div class='v-item animate' id='${rootId}' style='grid-column: span ${colSpan}; grid-row: span ${rowSpan}; --accent-bar: ${accent}; --accent: ${accent}; --accent-soft: ${accent}1A; --accent-tint: ${accent}0D; background: ${cardBg};'>`));
  parts.push(lit(`<div class='card-header'><div class='header-left'><div class='title'>`));
  parts.push(`${p}_Tit`);
  parts.push(lit(`</div></div>${sortButtonHtml}</div>`));
  if (cat.subtitle) {
    parts.push(lit(`<div class='subtitle'>`));
    parts.push(`${p}_Sub`);
    parts.push(lit(`</div>`));
  }
  parts.push(lit(`<div class='${listOpenClass}'>`));
  parts.push(`${p}_Rows`);
  parts.push(lit(listClose));
  parts.push(`IF(${p}_HasMore, "<div class='footer-note'>+" & FORMAT(${p}_TotalCategorias - ${maxCatVar}, "#,##0") & " categorias não exibidas</div>", "")`);
  if (sortScriptHtml) {
    parts.push(lit(sortScriptHtml));
  }
  parts.push(lit(`</div>`));

  const html = '\n' + parts.join(' & ') + ' & ';

  return { vars, html };
}

const CategoricalBarPreview: React.FC<{ config: BarChartConfig; ctx: ChartPreviewContext }> = ({ config, ctx }) => {
  const cat = config.categorical!;
  const isAlpha = cat.sortBy === 'alpha';
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(cat.sortBy === 'value_asc' ? 'asc' : 'desc');
  // Item 10: sem isso, mudar "Ordenação" no painel do Editor não refletia no
  // preview até o componente remontar — o useState acima só roda na montagem.
  useEffect(() => {
    setSortDir(cat.sortBy === 'value_asc' ? 'asc' : 'desc');
  }, [cat.sortBy]);
  const orientation = config.barOrientation || 'horizontal';
  const maxCategories = Math.max(1, cat.maxCategories ?? 10);
  const isSelected = ctx.selectedId === config.id;
  const accent = config.accentColor || ctx.global.primaryColor;
  const gradW = cat.useGradient ? `linear-gradient(90deg, ${accent}, ${accent}99)` : accent;
  const gradV = cat.useGradient ? `linear-gradient(0deg, ${accent}, ${accent}99)` : accent;

  const names = cat.testCategories || [];
  const rows = names.map((name, i) => ({ name, value: ctx.testValues[`${config.id}_cat_${i}`] ?? 0 }));
  const sorted = [...rows].sort((a, b) => {
    if (isAlpha) return a.name.localeCompare(b.name);
    return sortDir === 'asc' ? a.value - b.value : b.value - a.value;
  });
  const visible = sorted.slice(0, maxCategories);
  const hasMore = sorted.length > maxCategories;
  const max = visible.length > 0 ? Math.max(...visible.map(r => r.value)) : 0;

  const formatRow = (value: number) => formatTestValue(value, {
    formatType: config.formatType || 'none',
    decimalPlaces: config.decimalPlaces || 0,
    prefix: config.prefix,
    suffix: config.suffix,
  });

  // Animação de preenchimento real (não só decorativa): mesma técnica de
  // .ring-val/@keyframes fillRing já usada na produção (var(--fill) como
  // alvo do keyframe, calculado por instância) — não a classe .p-fill
  // genérica (essa tem animation:none forçado nos outros usos do preview
  // porque o alvo não é parametrizável por instância do jeito que é aqui).
  const fillAnimStyle = (
    <style>{`
      @keyframes barFillWidth-${config.id} { from { width: 0; } to { width: var(--fill); } }
      @keyframes barFillHeight-${config.id} { from { height: 0; } to { height: var(--fill); } }
    `}</style>
  );

  return (
    <div
      onClick={(e) => { e.stopPropagation(); ctx.onSelect(config.id); }}
      style={{
        gridColumn: `span ${config.colSpan || 1}`,
        gridRow: `span ${config.rowSpan || 1}`,
        background: config.cardBackgroundColor || ctx.global.cardBackgroundColor || '#ffffff',
        borderRadius: 'var(--p-radius)',
        padding: 'var(--p-pad)',
        border: isSelected ? '2px solid #4f46e5' : '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      {fillAnimStyle}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: config.fontSizeTitle || 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', minWidth: 0, color: ctx.global.textColorTitle }}>
          {config.title}
        </div>
        {cat.sortEnabled && !isAlpha && (
          <button
            onClick={(e) => { e.stopPropagation(); setSortDir(d => (d === 'asc' ? 'desc' : 'asc')); }}
            style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 5, background: `${accent}14`, border: `1px solid ${accent}33`, borderRadius: 7, padding: '4px 9px', fontSize: 9.5, fontWeight: 700, color: accent, cursor: 'pointer' }}
          >
            <svg viewBox='0 0 24 24' width='11' height='11' fill='none' stroke='currentColor' strokeWidth={2.5} strokeLinecap='round'><path d='M3 6h10M3 12h7M3 18h4M17 4v16m0 0l-4-4m4 4l4-4' /></svg>
            {sortDir === 'asc' ? 'Menor→maior' : 'Maior→menor'}
          </button>
        )}
      </div>
      {cat.subtitle && (
        <div style={{ fontSize: 10, fontWeight: 500, color: ctx.global.textColorSub, marginBottom: 10 }}>{cat.subtitle}</div>
      )}

      {visible.length === 0 && (
        <p style={{ fontSize: 11, color: ctx.global.textColorSub, textAlign: 'center', padding: '12px 0' }}>Sem categorias de teste ainda.</p>
      )}

      {orientation === 'vertical' ? (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130, marginTop: 4 }}>
          {visible.map((row, i) => {
            const pct = max > 0 ? Math.max(0, row.value / max) : 0;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 800, marginBottom: 4, color: ctx.global.textColorValue }}>{formatRow(row.value)}</div>
                <div style={{
                  width: '100%', maxWidth: 28, borderRadius: '6px 6px 0 0', background: gradV,
                  ...({ '--fill': `${pct * 100}%`, animation: `barFillHeight-${config.id} 1s cubic-bezier(0.16,1,0.3,1) forwards` } as any),
                }} />
                <div style={{ marginTop: 6, fontSize: 9, fontWeight: 600, color: ctx.global.textColorTitle, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{row.name}</div>
              </div>
            );
          })}
        </div>
      ) : orientation === 'ranking' ? (
        <div>
          {visible.map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: '0 0 20px', height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, background: i === 0 ? `${accent}1A` : `${accent}0D`, color: i === 0 ? accent : ctx.global.textColorSub }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: ctx.global.textColorTitle, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
              <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 6, fontWeight: 800, background: i === 0 ? `${accent}1A` : `${accent}0D`, color: i === 0 ? accent : ctx.global.textColorValue }}>{formatRow(row.value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {visible.map((row, i) => {
            const pct = max > 0 ? Math.max(0, row.value / max) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                <div style={{ flex: '0 0 84px', fontSize: 10, fontWeight: 600, color: ctx.global.textColorTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</div>
                <div className="p-track" style={{ flex: 1 }}>
                  <div style={{
                    height: '100%', borderRadius: 100, background: gradW,
                    ...({ '--fill': `${pct * 100}%`, animation: `barFillWidth-${config.id} 1s cubic-bezier(0.16,1,0.3,1) forwards` } as any),
                  }} />
                </div>
                <div style={{ flex: '0 0 auto', fontSize: 11, fontWeight: 800, minWidth: 40, textAlign: 'right', color: ctx.global.textColorValue }}>{formatRow(row.value)}</div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: 9, color: ctx.global.textColorSub, textAlign: 'right' }}>
          +{sorted.length - maxCategories} categorias não exibidas
        </div>
      )}
    </div>
  );
};

export const barChartType: ChartTypeDefinition<BarChartConfig> = {
  id: 'bar',

  // Multi-valor (N categorias, cada uma com seu próprio valor/cor) — não se
  // encaixa no hook de valor único do contrato. Ver nota em contract.ts.
  getConditionalTarget: () => null,

  generateDax: (config, ctx) => generateCategoricalBarDax(config, ctx),

  renderPreview: (config, ctx) => <CategoricalBarPreview config={config} ctx={ctx} />,
};
