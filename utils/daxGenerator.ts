import { GlobalConfig, CardConfig, AppTab } from '../types';
import { iconPaths } from './icons';
import {
  CONTAINER_BREAKPOINT_TABLET_PX, CONTAINER_BREAKPOINT_MOBILE_PX,
  DONUT_RADIUS, DONUT_CIRCUMFERENCE, RING_RADIUS, RING_CIRCUMFERENCE,
  BADGE_PADDING, BADGE_RADIUS_PX, BADGE_ICON_SIZE_PX, BADGE_ICON_STROKE_WIDTH,
  PROGRESS_BAR_DEFAULT_HEIGHT_PX, PROGRESS_BAR_RADIUS_PX,
  ANIMATION_EASING_DEFAULT, ANIMATION_EASING_POP_IN, CARD_BASE_TRANSITION,
} from './visualConstants';
import { buildConditionalSwitchDax } from './conditionalFormatting';
import { buildCategoryTableDax, buildSlotRankingDax } from './categoricalDax';
import { buildValueFormatDax } from './valueFormatDax';
import { chartTypeRegistry } from './chartTypes';
import { resolveChartSizePct, resolveGaugeSemiGeometry } from './gaugeMath';

export const generateDAX = (global: GlobalConfig, items: any[], tab: AppTab = 'cards'): string => {
  const { 
    columnsDesktop, columnsTablet, columnsMobile, 
    gap, padding, 
    marginType, marginAll, marginTop, marginRight, marginBottom, marginLeft, // <- Adicione isso
    primaryColor, cardBackgroundColor,
    textColorTitle, textColorValue, textColorSub,
    positiveColor, negativeColor,
    animation, animationDuration, hoverEffect, borderRadius, cardMinHeight, 
    fontSizeTitle, fontSizeValue, fontSizeSub, fontSizeBadge,
    fontWeightTitle, fontWeightValue, textAlign,
    shadowIntensity, shadowBlur, shadowDistance
  } = global;

  const isCompact = cardMinHeight < 140;

  const getFlexAlign = (align: string) => {
      switch(align) {
          case 'center': return 'center';
          case 'right': return 'flex-end';
          default: return 'flex-start';
      }
  }

  const shadowAlpha = (shadowIntensity || 0) / 100;
  const shadowCSS = `0 ${shadowDistance}px ${shadowBlur}px rgba(0,0,0,${shadowAlpha})`;
  const dur = `${animationDuration}s`;
  
  let animationCSS = '';
  if (animation === 'fadeInUp') {
    animationCSS = `.animate { animation: fadeInUp ${dur} ${ANIMATION_EASING_DEFAULT} forwards; opacity: 0; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  } else if (animation === 'popIn') {
    animationCSS = `.animate { animation: popIn ${dur} ${ANIMATION_EASING_POP_IN} forwards; opacity: 0; } @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`;
  } else if (animation === 'slideRight') {
    animationCSS = `.animate { animation: slideRight ${dur} ${ANIMATION_EASING_DEFAULT} forwards; opacity: 0; } @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`;
  }

  let hoverCSS = '';
  switch (hoverEffect) {
    case 'lift': 
      hoverCSS = `.v-item:hover { 
        transform: translateY(-6px) !important; 
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), box-shadow 0.4s ease !important;
        box-shadow: 0 ${shadowDistance + 10}px ${shadowBlur + 10}px rgba(0,0,0,${shadowAlpha + 0.1}); 
      }`; 
      break;
    case 'scale': 
      hoverCSS = `.v-item:hover { 
        transform: scale(1.02) !important; 
        transition: transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1) !important;
        z-index: 10; 
      }`; 
      break;
    case 'glow': hoverCSS = `.v-item:hover { box-shadow: 0 0 30px ${primaryColor.includes('gradient') ? '#cc092f' : global.primaryColor}55; }`; break;
    case 'border': hoverCSS = `.v-item:hover { border-color: ${primaryColor.includes('gradient') ? '#cc092f' : global.primaryColor}; }`; break;
  }

  const cssCompacto = isCompact ? `
      .v-item { flex-direction: row; align-items: center; justify-content: space-between; gap: 12px; padding-right: 12px; }
      .v-item::before { top: 15%; bottom: 15%; width: 4px; display: block; }
      .compact-left { display: flex; flex-direction: column; justify-content: center; z-index: 2; flex: 1; min-width: 0; margin-left: 8px; }
      .compact-right { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 2px; z-index: 2; }
      .compact-header { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
      .compact-icon { width: 14px; height: 14px; opacity: 0.7; }
      .title { font-size: ${Math.max(9, fontSizeTitle - 1)}px; margin-bottom: 0; }
      .value { font-size: ${Math.max(14, fontSizeValue - 6)}px; line-height: 1; }
      .footer { margin-top: 0; padding-top: 0; align-items: flex-end; }
      .progress-bar-bottom { position: absolute; bottom: 0; left: 0; height: 3px; background: var(--accent); transition: width 1s ease; }
    ` : `
      .v-item { flex-direction: column; }
      .header { display: flex; align-items: center; margin-bottom: 6px; width: 100%; gap: 8px; flex-shrink: 0; }
      .content-wrapper { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-height: 0; }
      .footer { margin-top: auto; padding-top: 10px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; }
    `;

  let dax = `Visual_Gerado =
VAR _CorPrimaria = "${primaryColor}"
VAR _CorPos      = "${positiveColor}"
VAR _CorNeg      = "${negativeColor}"
`;

  // Fase 4, Etapa 5 — despacho puro: toda a lógica de barra mora em
  // utils/chartTypes/bar/barChartType.tsx (ver clarificação de escopo em
  // contract.ts). Calculado uma vez só, fora dos dois loops abaixo (VAR e
  // HTML), porque generateDax() já devolve as duas metades juntas — nenhuma
  // lógica de negócio de barra é escrita aqui, só concatenação do resultado.
  const barDaxResults = tab === 'bars'
    ? (items || []).map((barConfig, idx) => chartTypeRegistry.bar.generateDax(barConfig, { global, index: idx + 1 }))
    : [];

  // === GERAÇÃO DE VARIÁVEIS DAX ===
  if (tab === 'cards') {
    (items || []).forEach((card, cIdx) => {
      const ci = cIdx + 1;

      // Fase 3 etapa 3: card em modo categórico tem uma família de VARs
      // totalmente diferente (por slot, não um _C{ci}_Val_Raw único) — gera
      // e sai cedo, não passa pela lógica normal de card único abaixo.
      if (card.categorical) {
        const cat = card.categorical;
        const columnExpr = cat.column || '""';
        const tableVar = `_C${ci}_CatTable`;
        dax += buildCategoryTableDax({
          varName: tableVar, columnExpr, measureExpr: card.measurePlaceholder || "0",
        });

        const slotValueVars: string[] = [];
        for (let n = 1; n <= cat.maxSlots; n++) {
          const varPrefix = `_C${ci}_Slot${n}`;
          const ranking = buildSlotRankingDax({
            tableVar, columnExpr, valueColumnExpr: '[@CatValue]',
            sortBy: cat.sortBy, slotIndex: n, varPrefix,
          });
          dax += ranking.daxVars;
          slotValueVars.push(ranking.valueVar);
          const fmt = buildValueFormatDax(ranking.valueVar, varPrefix, card);
          dax += fmt.dax;
        }

        if (cat.showOthersBucket) {
          const othersRawVar = `_C${ci}_Others_Raw`;
          dax += `VAR _C${ci}_TotalAll = CALCULATE(${card.measurePlaceholder || "0"}, ALL(${columnExpr}))\n`;
          dax += `VAR _C${ci}_TopNSum = ${slotValueVars.length > 0 ? slotValueVars.join(' + ') : '0'}\n`;
          dax += `VAR ${othersRawVar} = _C${ci}_TotalAll - _C${ci}_TopNSum\n`;
          dax += `VAR _C${ci}_HasOthers = COUNTROWS(${tableVar}) > ${cat.maxSlots}\n`;
          const othersFmt = buildValueFormatDax(othersRawVar, `_C${ci}_Others`, card);
          dax += othersFmt.dax;
        }
        return;
      }

      dax += `VAR _C${ci}_Tit = "${card.title}"\n`;
      dax += `VAR _C${ci}_Val_Raw = ${card.measurePlaceholder || "0"}\n`;
      const { dax: valFmtDax } = buildValueFormatDax('_C' + ci + '_Val_Raw', '_C' + ci, card);
      dax += valFmtDax;

      if (card.type === 'progress' || card.type === 'ring') {
         // 'ring' (mini anel de progresso, ver renderRing em Preview.tsx) usa a mesma
         // Medida Realizado/Meta que 'progress' já usava — não é um par de campos novo.
         dax += `VAR _C${ci}_Prog_Val = ${card.progressMeasure || card.measurePlaceholder || "0"}\n`;
         dax += `VAR _C${ci}_Prog_Tgt = ${card.progressTarget || "100"}\n`;
         dax += `VAR _C${ci}_Prog_Pct = MIN(1, MAX(0, DIVIDE(_C${ci}_Prog_Val, _C${ci}_Prog_Tgt, 0)))\n`;
      }

      (card.comparisons || []).forEach((comp, cpIdx) => {
        const cpi = cpIdx + 1;
        dax += `VAR _C${ci}_Comp${cpi}_Lab = "${comp.label}"\n`;
        dax += `VAR _C${ci}_Comp${cpi}_Val_Raw = ${comp.measurePlaceholder || "0"}\n`;
        dax += `VAR _C${ci}_Comp${cpi}_Val = FORMAT(_C${ci}_Comp${cpi}_Val_Raw, "+0.0%;-0.0%;0%")\n`;
        
        // Avalia dinamicamente se a própria medida é maior que 0
        dax += `VAR _C${ci}_Comp${cpi}_Log = _C${ci}_Comp${cpi}_Val_Raw > 0\n`; 
      });
      dax += `\n`;
    });
  } else if (tab === 'donuts') {
     (items || []).forEach((donut, dIdx) => {
        const di = dIdx + 1;
        dax += `VAR _D${di}_Tit = "${donut.title}"\n`;
        if (donut.mode === 'completeness') {
            dax += `VAR _D${di}_Val_Raw = ${donut.completenessMeasure || "0"}\n`;
            dax += `VAR _D${di}_Target = ${donut.completenessTarget || "1"}\n`;
            dax += `VAR _D${di}_Pct = MIN(1, MAX(0, DIVIDE(_D${di}_Val_Raw, _D${di}_Target, 0)))\n`;
        } else {
            (donut.slices || []).forEach((slice, sIdx) => {
               dax += `VAR _D${di}_S${sIdx+1}_Val = ${slice.measurePlaceholder || "0"}\n`;
            });
            dax += `VAR _D${di}_Total = ` + (donut.slices || []).map((_, i) => `_D${di}_S${i+1}_Val`).join(" + ") + `\n`;
        }
        if (donut.showCenterText) {
            dax += `VAR _D${di}_CenterVal = ${donut.centerTextValueMeasure || '""'}\n`;
        }
     });
  } else {
     // tab === 'bars' — despacho puro (ver barDaxResults acima).
     barDaxResults.forEach(r => { dax += r.vars; });
  }

  // === GERAÇÃO DO CSS ===
  dax += `
VAR _CSS = "
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; background: transparent; font-family: 'Inter', -apple-system, sans-serif; overflow: hidden; }
    
    .wrapper { 
        container-type: inline-size; 
        width: 100vw; height: 100vh; box-sizing: border-box; 
    }
    
    .container { 
        display: grid; 
        grid-template-columns: repeat(${columnsDesktop || 3}, 1fr); 
        grid-auto-rows: 1fr; 
        gap: ${gap}px; 
        padding: ${(marginType || 'all') === 'specific' ? `${marginTop ?? 10}px ${marginRight ?? 10}px ${marginBottom ?? 10}px ${marginLeft ?? 10}px` : `${marginAll ?? 10}px`};
        width: 100%; height: 100%; box-sizing: border-box;
    }

    @container (max-width: ${CONTAINER_BREAKPOINT_TABLET_PX}px) {
        .container { grid-template-columns: repeat(${columnsTablet || 2}, 1fr); }
    }
    @container (max-width: ${CONTAINER_BREAKPOINT_MOBILE_PX}px) {
        .container { grid-template-columns: repeat(${columnsMobile || 1}, 1fr); }
        .v-item { grid-column: span 1 !important; grid-row: span 1 !important; }
    }
    
    .v-item { 
        background: ${cardBackgroundColor}; 
        border-radius: ${borderRadius}px; 
        padding: ${padding}px; 
        border: 1px solid rgba(0,0,0,0.06);
        display: flex;
        transition: ${CARD_BASE_TRANSITION};
        position: relative; overflow: hidden;
        min-height: ${cardMinHeight}px;
        box-shadow: ${shadowCSS};
    }
    /* Fase 2: --accent-bar é uma variável PRÓPRIA, separada de --accent — a
       formatação condicional afeta só a borda, sem mudar barra de progresso,
       anel ou qualquer outro consumidor de --accent. */
    .v-item::before {
        content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 5px;
        background: var(--accent-bar); border-radius: 0 100px 100px 0;
        display: var(--accent-display, block);
    }
    ${hoverCSS} ${animationCSS}
    
    /* Fase 1 item 2: flex-shrink:0 impedia o item de encolher, então overflow/ellipsis
       nunca chegavam a agir de fato (o título estourava o card em vez de truncar).
       min-width:0 permite encolher; max-width:100% dá um teto mesmo no header 'top'
       (flex-column sem align-items:stretch, onde nada mais limita a largura). */
    .title { text-transform: uppercase; font-size: ${fontSizeTitle}px; font-weight: ${fontWeightTitle}; color: ${textColorTitle}; letter-spacing: 0.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; max-width: 100%; }
    /* Fase 1 (fechamento): white-space: nowrap tirado de propósito — valor não tem proteção de
       overflow (ellipsis seria enganoso num número), então em vez de cortar/vazar, quebra linha.
       Aplica nos dois modos (regra base, herdada pelo compact também). */
    .value { font-size: ${fontSizeValue}px; font-weight: ${fontWeightValue}; color: ${textColorValue}; white-space: normal; overflow-wrap: break-word; }
    
    .row { display: flex; justify-content: ${isCompact ? 'flex-end' : 'space-between'}; align-items: center; font-weight: 600; color: ${textColorSub}; gap: 6px; }
    .row-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }    
    .badge {
      font-size: ${fontSizeBadge || 10}px; padding: ${BADGE_PADDING}; border-radius: ${BADGE_RADIUS_PX}px; font-weight: 800; display: flex; align-items: center; gap: 4px; letter-spacing: -0.02em;
      /* Fallback pra quando nada inline sobrescreve (barras no modo ranking —
         cards sempre definem color/background inline por comparativo, então
         isso nunca aparece pra eles). Sem isso, o badge "não-#1" saía sem
         nenhum estilo em produção. */
      background: var(--accent-tint, rgba(128,128,128,0.12)); color: ${textColorValue};
    }
    .badge svg { width: ${BADGE_ICON_SIZE_PX}px; height: ${BADGE_ICON_SIZE_PX}px; stroke-width: ${BADGE_ICON_STROKE_WIDTH}; }
    .icon-box { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .progress-track { width: 100%; background: #f3f4f6; border-radius: ${PROGRESS_BAR_RADIUS_PX}px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: ${PROGRESS_BAR_RADIUS_PX}px; transition: width 1s ease; }

    /* CardType 'ring' — espelha .ring-box/.ring-svg/.ring-bg/.ring-val de Preview.tsx. */
    .ring-box { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-bg { fill: transparent; stroke: #f3f4f6; stroke-width: 5; }
    .ring-val { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; stroke-dasharray: ${RING_CIRCUMFERENCE}; stroke-dashoffset: ${RING_CIRCUMFERENCE}; animation: fillRing 1.2s ease-out forwards; }
    .ring-text { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
    @keyframes fillRing { to { stroke-dashoffset: var(--offset); } }
    
    /* FIX DE RESPONSIVIDADE DO GRÁFICO */
    .chart-box { 
        flex: 1; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        position: relative; 
        padding: 5px;
        min-height: 0; /* Permite encolher abaixo do mínimo */
        min-width: 0;  /* Permite encolher abaixo do mínimo */
        overflow: hidden;
    }
    .center-text { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; }

    /* Gráfico de barras — modo categórico (3 orientações). Reaproveita .title/
       .badge/.v-item já existentes; classes abaixo são só as novas. */
    .card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
    .header-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .subtitle { font-size: 11px; font-weight: 500; color: ${textColorSub}; margin: 4px 0 14px 0; }
    .sort-btn { flex: 0 0 auto; display: flex; align-items: center; gap: 5px; background: var(--accent-soft); border: 1px solid var(--accent-bar); border-radius: 7px; padding: 4px 9px; font-size: 9.5px; font-weight: 700; color: var(--accent-bar); cursor: pointer; }
    .sort-btn svg { width: 11px; height: 11px; flex-shrink: 0; }
    .footer-note { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.05); font-size: 10px; color: ${textColorSub}; text-align: right; }

    .bar-cat-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .bar-cat-row:last-of-type { margin-bottom: 0; }
    .bar-label { flex: 0 0 92px; font-size: 11px; font-weight: 600; color: ${textColorTitle}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .bar-track { flex: 1; height: 8px; background: #F3F4F6; border-radius: 100px; overflow: hidden; }
    /* Preenchimento anima de verdade no carregamento (não só num transition, que
       não dispara no primeiro paint porque o HTML já nasce com a largura final
       no atributo style) — mesmo truque de --offset já usado em .ring-val abaixo. */
    .bar-fill { height: 100%; border-radius: 100px; animation: fillBarWidth 1s cubic-bezier(0.16,1,0.3,1) forwards; }
    @keyframes fillBarWidth { from { width: 0; } to { width: var(--fill); } }
    .bar-value { flex: 0 0 auto; font-size: 12px; font-weight: 800; color: ${textColorValue}; min-width: 44px; text-align: right; }

    .bar-row-rank { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
    .bar-row-rank:last-of-type { margin-bottom: 0; }
    .rank-badge { flex: 0 0 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; background: var(--accent-tint, rgba(128,128,128,0.12)); color: ${textColorSub}; }
    .rank-badge.is-first, .badge.is-first { background: var(--accent-soft); color: var(--accent-bar); }
    .rank-label { flex: 1; font-size: 12px; font-weight: 600; color: ${textColorTitle}; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .v-columns { display: flex; align-items: flex-end; gap: 14px; height: 150px; margin-top: 10px; padding: 0 4px; }
    .v-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; min-width: 0; }
    .v-col-value { font-size: 11px; font-weight: 800; color: ${textColorValue}; margin-bottom: 6px; }
    .v-col-bar { width: 100%; max-width: 34px; border-radius: 6px 6px 0 0; animation: fillBarHeight 1s cubic-bezier(0.16,1,0.3,1) forwards; }
    @keyframes fillBarHeight { from { height: 0; } to { height: var(--fill); } }
    .v-axis { height: 1px; background: #E5E7EB; }
    .v-col-label { margin-top: 8px; font-size: 10px; font-weight: 600; color: ${textColorTitle}; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    ${cssCompacto}
</style>"

VAR _HTML = "<div class='wrapper'><div class='container'>" &
`;

// === GERAÇÃO DO HTML (Cards, Charts ou Barras) ===
    if (tab === 'cards') {
      (items || []).forEach((card, idx) => {
        const ci = idx + 1;

        // Fase 3 etapa 3: card categórico vira 1 wrapper (mini-grid próprio,
        // mesma ideia do Preview.tsx) contendo até maxSlots cards pequenos +
        // "Outros" opcional. Sem header-position/compact — layout fixo e simples,
        // slots são pequenos por natureza. Sai cedo, não usa o motor normal abaixo.
        if (card.categorical) {
          const cat = card.categorical;
          const actualAccent = card.accentColor || primaryColor;
          const actualCardBg = card.cardBackgroundColor || cardBackgroundColor;
          const slotIconPath = iconPaths[card.icon || 'chart'];
          const slotIconColor = card.iconColor || card.accentColor || primaryColor;
          const fTitle = Math.min(card.fontSizeTitle || fontSizeTitle, 10);
          const fValue = Math.min(card.fontSizeValue || fontSizeValue, 22);
          const groupLabelText = `📊 Grupo: ${(card.title || 'Categoria')} (${cat.maxSlots}${cat.showOthersBucket ? '+Outros' : ''} cards)`;

          const slotIconHTML = `<div class='icon-box' style='width:24px; height:24px; padding:4px; color:${slotIconColor}'><svg viewBox='0 0 24 24' width='100%' height='100%' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${slotIconPath}'/></svg></div>`;

          const buildSlotHTML = (nameExpr: string, valExpr: string, visibleCondition: string, accentBarStyle: string) => `
              "<div class='v-item' style='display: " & IF(${visibleCondition}, "flex", "none") & "; flex-direction: column; --accent: ${actualAccent}; ${accentBarStyle}background: ${actualCardBg}; padding: 10px;'>
                  <div class='header' style='flex-direction: column; align-items: flex-start; margin-bottom: 4px;'>${slotIconHTML}<div class='title' style='font-size: ${fTitle}px; margin-top: 4px;'>" & ${nameExpr} & "</div></div>
                  <div class='value' style='font-size: ${fValue}px;'>" & ${valExpr} & "</div>
              </div>" & `;

          let slotsHTML = '';
          for (let n = 1; n <= cat.maxSlots; n++) {
            const varPrefix = `_C${ci}_Slot${n}`;
            const nameVar = `${varPrefix}_Name`;
            const valVar = `${varPrefix}_Val`;
            const switchExpr = buildConditionalSwitchDax(`${varPrefix}_Value`, card.conditionalRules, `"${actualAccent}"`);
            const accentBarStyle = switchExpr ? `--accent-bar: " & (${switchExpr}) & "; ` : `--accent-bar: ${actualAccent}; `;
            slotsHTML += buildSlotHTML(nameVar, valVar, `NOT(ISBLANK(${nameVar}))`, accentBarStyle);
          }

          if (cat.showOthersBucket) {
            // Outros: só título+valor — sem formatação condicional nem comparativos
            // (decidido na etapa de UI). Visível só quando há categorias excedentes.
            slotsHTML += buildSlotHTML(`"Outros"`, `_C${ci}_Others_Val`, `_C${ci}_HasOthers`, `--accent-bar: ${actualAccent}; `);
          }

          dax += `
        "<div style='grid-column: span ${card.colSpan || 1}; grid-row: span ${card.rowSpan || 1}; display:flex; flex-direction:column;'><div style='font-size:10px; font-weight:900; color:#94a3b8; text-transform:uppercase; letter-spacing:0.05em; padding:0 4px 8px 4px;'>${groupLabelText}</div><div style='display:grid; grid-template-columns:repeat(${cat.columns}, 1fr); gap:${gap}px; flex:1;'>" & `;
          dax += slotsHTML;
          dax += `"</div></div>" & `;
          return;
        }

        const delay = (idx * 0.1).toFixed(1);
        const iconPath = iconPaths[card.icon || 'chart'];
        const iconColor = card.iconColor || card.accentColor || primaryColor;
        const colSpan = card.colSpan || 1;
        const rowSpan = card.rowSpan || 1;

        // SINCRONIZAÇÃO DE FONTES COM O PREVIEW.TSX
        const baseFTitle = card.fontSizeTitle || fontSizeTitle;
        const baseFValue = card.fontSizeValue || fontSizeValue;
        const fSub = card.fontSizeSub || fontSizeSub;
        
        const fTitle = isCompact ? Math.min(baseFTitle, 10) : baseFTitle;
        const fValue = isCompact ? Math.min(baseFValue, 26) : baseFValue;
        
        const iconHTML = `
          <div class='icon-box' style='width:${card.iconSize || 40}px; height:${card.iconSize || 40}px; padding:${card.iconPadding || 8}px; background:${card.iconBackgroundColor || 'transparent'}; border-radius:${card.iconRounded ? '50%' : '8px'}; color:${iconColor}'>
              <svg viewBox='0 0 24 24' width='100%' height='100%' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${iconPath}'/></svg>
          </div>`;

        // Fase isolada 8: espelha renderRing() de Preview.tsx. Só é montado (e só faz
        // sentido) quando card.type === 'ring' — usa _C${ci}_Prog_Pct, calculado acima
        // a partir de Medida Realizado / Meta (mesmos campos que 'progress' já usava).
        const ringHTML = `" & "<div class='ring-box'><svg viewBox='0 0 50 50' class='ring-svg'><circle class='ring-bg' cx='25' cy='25' r='${RING_RADIUS}' /><circle class='ring-val' cx='25' cy='25' r='${RING_RADIUS}' style='--offset: " & (${RING_CIRCUMFERENCE} - (${RING_CIRCUMFERENCE} * _C${ci}_Prog_Pct)) & ";' /></svg><div class='ring-text' style='color:${textColorValue}'>" & ROUND(_C${ci}_Prog_Pct * 100, 0) & "%</div></div>" & "`;

        // NOVO: Construtor de array limpo para os comparativos (v0.4.0)
        let compsDAX = "";
        if (card.comparisons && card.comparisons.length > 0) {
            const compsList = card.comparisons.map((c, cpIdx) => {
                const cpi = cpIdx + 1;
                const trueColor = c.invertColor ? "_CorNeg" : "_CorPos";
                const falseColor = c.invertColor ? "_CorPos" : "_CorNeg";
                const displayMode = c.displayMode || 'trend+value';
                const iconType = c.iconType || 'trending';

                // Get icon paths based on iconType
                let iconPathUp = iconPaths['trendingUp'];
                let iconPathDown = iconPaths['trendingDown'];
                if (iconType === 'proportion') {
                  iconPathUp = "M4 12h16M4 10v4M20 10v4"; // horizontal bar
                  iconPathDown = "M4 12h16M4 10v4M20 10v4";
                } else if (iconType === 'arrow') {
                  iconPathUp = "M7 17L17 7M17 7H7M17 7V17"; // arrow-up-right
                  iconPathDown = "M17 7L7 17M7 17h10M7 17V7"; // arrow-down-left
                } else if (iconType === 'check') {
                  iconPathUp = "M22 11.08V12a10 10 0 1 1-5.93-9.14M9 11l3 3L22 4"; // check
                  iconPathDown = "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM15 9l-6 6M9 9l6 6"; // x
                } else if (iconType === 'bar') {
                  // Espelha o "▯" de Preview.tsx com um ícone real (mesmo path de utils/icons.ts
                  // usado no resto do app) — distinto do path de 'proportion' acima.
                  iconPathUp = iconPaths['barChart'];
                  iconPathDown = iconPaths['barChart'];
                } else if (iconType === 'dot') {
                  iconPathUp = iconPaths['dot'];
                  iconPathDown = iconPaths['dot'];
                } else if (iconType === 'star') {
                  iconPathUp = iconPaths['star'];
                  iconPathDown = iconPaths['star'];
                } else if (iconType === 'alert') {
                  iconPathUp = iconPaths['alertTriangle'];
                  iconPathDown = iconPaths['alertTriangle'];
                }
                // Nenhum destes 4 varia por trend (up/down) — mesmo comportamento de Preview.tsx,
                // que sempre mostra o mesmo glifo independente da direção.

                const iconSvg = `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'><path d='" & IF(_C${ci}_Comp${cpi}_Log, "${iconPathUp}", "${iconPathDown}") & "'/></svg>`;

                // Render based on displayMode
                if (displayMode === 'trend-only') {
                  return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${c.labelColor || textColorSub}'>" & _C${ci}_Comp${cpi}_Lab & "</span><span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor}, ${falseColor}) & "; background-color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor} & "1A", ${falseColor} & "1A") & ";'>${iconSvg}</span></div>"`;
                } else if (displayMode === 'proportion-only') {
                  return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${c.labelColor || textColorSub}'>" & _C${ci}_Comp${cpi}_Lab & "</span><span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor}, ${falseColor}) & "; background-color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor} & "1A", ${falseColor} & "1A") & ";'>" & _C${ci}_Comp${cpi}_Val & "</span></div>"`;
                } else if (displayMode === 'custom') {
                  // Fase 1 item 4: labelColor, quando definido, é um valor fixo (não depende do
                  // trend/dado) — sobrescreve completamente o IF() do DAX, igual a Preview.tsx.
                  if (c.labelColor) {
                    return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${c.labelColor}'>" & _C${ci}_Comp${cpi}_Lab & "</span><span class='badge' style='color: ${c.labelColor}; background-color: ${c.labelColor}1A;'>${iconSvg} " & _C${ci}_Comp${cpi}_Val & "</span></div>"`;
                  }
                  return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${textColorSub}'>" & _C${ci}_Comp${cpi}_Lab & "</span><span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor}, ${falseColor}) & "; background-color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor} & "1A", ${falseColor} & "1A") & ";'>${iconSvg} " & _C${ci}_Comp${cpi}_Val & "</span></div>"`;
                } else {
                  // default: trend+value
                  return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${c.labelColor || textColorSub}'>" & _C${ci}_Comp${cpi}_Lab & "</span><span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor}, ${falseColor}) & "; background-color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor} & "1A", ${falseColor} & "1A") & ";'>${iconSvg} " & _C${ci}_Comp${cpi}_Val & "</span></div>"`;
                }
            });
            compsDAX = `" & ${compsList.join(" & ")} & "`;
        }

        // Resolve a cor exata no JS em vez de usar DAX IF(ISBLANK)
        const actualCardBg = card.cardBackgroundColor || cardBackgroundColor;
        const actualAccent = card.accentColor || primaryColor;

        // Fase 2: accent-bar — se não há regras, é o mesmo accentColor estático de sempre
        // (sem VAR extra, sem custo). Se há regras, vira um SWITCH(TRUE(),...) avaliado
        // pelo motor DAX, e o valor precisa de uma quebra de string (" & ... & ") porque
        // deixa de ser um literal fixo. Ver utils/conditionalFormatting.ts.
        const conditionalSwitch = buildConditionalSwitchDax(`_C${ci}_Val_Raw`, card.conditionalRules, `"${actualAccent}"`);
        const accentBarStyle = conditionalSwitch
          ? `--accent-bar: " & (${conditionalSwitch}) & "; `
          : `--accent-bar: ${actualAccent}; `;

        const gridStyle = `grid-column: span ${colSpan}; grid-row: span ${rowSpan};`;

        if (isCompact) {
            let visualHtml = "";
            if (card.type === 'progress') {
              const progColor = card.progressColor || card.accentColor ? (card.progressColor || card.accentColor) : 'var(--accent)';
              visualHtml = `" & "<div class='progress-bar-bottom' style='width: " & (_C${ci}_Prog_Pct * 100) & "%; background: ${progColor};'></div>" & "`;
            }

            dax += `
            "<div class='v-item animate' style='${gridStyle} animation-delay: ${delay}s; --accent: ${actualAccent}; ${accentBarStyle}background: ${actualCardBg};'>
                <div class='compact-left'>
                    <div class='compact-header'>
                      <div class='compact-icon' style='color:${iconColor}'><svg viewBox='0 0 24 24' width='100%' height='100%' fill='none' stroke='currentColor' stroke-width='2'><path d='${iconPath}'/></svg></div>
                      <div class='title' style='font-size: ${fTitle}px;'>" & _C${ci}_Tit & "</div>
                    </div>
                    <div class='value' style='font-size: ${fValue}px;'>" & _C${ci}_Val & "</div>
                </div>
                <div class='compact-right'>
                    <div class='footer'>${compsDAX}</div>
                </div>
                ${visualHtml}
            </div>" & `;
        
        } else {
            const align = card.textAlign || textAlign;
            const flexAlign = getFlexAlign(align);
            const iconPos = card.iconPosition || 'top';
            let headerHTML = "";
            
            if (iconPos === 'top') {
                let colAlign = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
                const topVisual = card.type === 'ring' ? ringHTML : iconHTML;
                headerHTML = `<div class='header' style='flex-direction: column; align-items: ${colAlign}; justify-content: center'>${topVisual} <div class='title' style='font-size: ${fTitle}px; margin-top: 4px;'>" & _C${ci}_Tit & "</div></div>`;
            } else if (iconPos === 'left') {
                // Espelha Preview.tsx: em iconPosition 'left', type 'ring' não mostra
                // nenhum visual (nem ícone nem anel) — comportamento existente, não corrigido aqui.
                const leftVisual = card.type === 'ring' ? '' : iconHTML;
                headerHTML = `<div class='header' style='justify-content: ${flexAlign}'>${leftVisual} <div class='title' style='font-size: ${fTitle}px;'>" & _C${ci}_Tit & "</div></div>`;
            } else {
                const rightVisual = card.type === 'ring' ? ringHTML : iconHTML;
                headerHTML = `<div class='header' style='justify-content: space-between'><div class='title' style='font-size: ${fTitle}px;'>" & _C${ci}_Tit & "</div> ${rightVisual}</div>`;
            }

            let progressHTML = "";
            if (card.type === 'progress') {
              const progColor = card.progressColor || card.accentColor ? (card.progressColor || card.accentColor) : 'var(--accent)';
              progressHTML = `" & "<div class='progress-track' style='height: ${card.progressHeight || PROGRESS_BAR_DEFAULT_HEIGHT_PX}px; background: ${card.progressBackgroundColor || '#f3f4f6'}; margin-top: auto;'><div class='progress-fill' style='width: " & (_C${ci}_Prog_Pct * 100) & "%; background: ${progColor};'></div></div>" & "`;
            }

            const contentHTML = `
              <div class='content-box' style='display: flex; flex-direction: column; flex: 1;'>
                  <div class='value' style='text-align: ${align}; font-size: ${fValue}px;'>" & _C${ci}_Val & "</div>${progressHTML}
              </div>
            `;

            dax += `
              "<div class='v-item animate' style='${gridStyle} animation-delay: ${delay}s; --accent: ${actualAccent}; ${accentBarStyle}background: ${actualCardBg};'>
                  <div class='content-wrapper'>
                      ${headerHTML}
                      ${contentHTML}
                  </div>
                  <div class='footer'>${compsDAX}</div>
              </div>" & `;
        }
      });
  } else if (tab === 'donuts') {
     // === LOGICA DO GRÁFICO (CHART) ===
     (items || []).forEach((donut, idx) => {
      const di = idx + 1;
      const flexAlign = getFlexAlign(donut.textAlign || textAlign);
      const isSemi = donut.geometry === 'semicircle';
      const radius = DONUT_RADIUS;
      const circ = DONUT_CIRCUMFERENCE;
      const sw = donut.ringThickness || 12;
      const lcap = (donut.mode === 'distribution') ? "butt" : (donut.roundedCorners ? "round" : "butt");
      
      const rotation = isSemi ? "rotate(-180 50 50)" : "rotate(-90 50 50)";
      const colSpan = donut.colSpan || 1;
      const rowSpan = donut.rowSpan || 1;
      const gridStyle = `grid-column: span ${colSpan}; grid-row: span ${rowSpan};`;

      let chartContent = "";
      if (donut.mode === 'completeness') {
        const conversion = isSemi ? `(${circ}/2)` : `${circ}`;
        chartContent = `
          "<circle cx='50' cy='50' r='${radius}' fill='transparent' stroke='rgba(0,0,0,0.05)' stroke-width='${sw}' stroke-dasharray='${isSemi ? circ/2 : 0} ${circ}' transform='${rotation}' />" &
          "<circle cx='50' cy='50' r='${radius}' fill='transparent' stroke='" & IF(ISBLANK("${donut.accentColor}"), _CorPrimaria, "${donut.accentColor}") & "' stroke-width='${sw}' 
            stroke-dasharray='" & (_D${di}_Pct * ${conversion}) & " ${circ}' 
            stroke-linecap='${lcap}' transform='${rotation}' />"`;
      } else {
         let currentOffset = "0";
        (donut.slices || []).forEach((slice, sIdx) => {
            const si = sIdx + 1;
            const conversion = isSemi ? `(${circ}/2)` : `${circ}`;
            const pct = `DIVIDE(_D${di}_S${si}_Val, _D${di}_Total, 0)`;
            chartContent += ` & "<circle cx='50' cy='50' r='${radius}' fill='transparent' stroke='${slice.color}' stroke-width='${sw}' 
                stroke-dasharray='" & (${pct} * ${conversion}) & " ${circ}' 
                stroke-dashoffset='" & (-(${currentOffset}) * ${conversion}) & "'
                stroke-linecap='${lcap}' transform='${rotation}' />"`;
            currentOffset += ` + ${pct}`;
        });
      }
      
      // Fix do gauge (round 2 — aspect-ratio): round 1 (ratio fixo em % de
      // altura) resolveu o "não cresce mais" mas não a causa raiz — a
      // fórmula nunca conhecia a proporção real do card, então cards
      // altos/estreitos ainda sobravam espaço (preserveAspectRatio="meet"
      // continua limitado pela MENOR dimensão disponível, geralmente a
      // largura). Fix real: viewBox recortado + CSS aspect-ratio com a
      // MESMA proporção — o browser escolhe sozinho qual dimensão é o
      // limite, sem sobra. Mesmo código de utils/gaugeMath.ts usado em
      // Preview.tsx (paridade preview↔produção).
      const sizePct = resolveChartSizePct(donut.chartSize);
      const semiGeometry = resolveGaugeSemiGeometry(donut.ringThickness);
      const fLabel = donut.fontSizeLabel || 9;
      const fVal = donut.fontSizeValue || 16;
      const dTitleSize = donut.fontSizeTitle || fontSizeTitle;

      // Fix do gauge: top:50% sempre — relativo ao WRAPPER (não mais ao
      // chart-box inteiro), e o recorte do viewBox no modo semicírculo já É
      // a região do conteúdo, então seu centro cai em 50% por construção.
      const center = donut.showCenterText ? `"<div class='center-text' style='top: 50%; left: 50%; transform: translate(-50%, -50%);'><div style='font-size: ${fLabel}px; font-weight: 800; color: ${textColorSub}; text-transform: uppercase; letter-spacing: 0.05em;'>${donut.centerTextLabel}</div><div style='font-size: ${fVal}px; font-weight: 800; color: ${textColorValue}; margin-top: 2px;'>" & _D${di}_CenterVal & "</div></div>"` : '""';
      const gaugeBoxStyle = isSemi
        ? `width: ${sizePct}%; max-width: 100%; max-height: 100%; aspect-ratio: ${semiGeometry.aspectRatio}; height: auto;`
        : `width: ${sizePct}%; height: ${sizePct}%; max-width: 100%; max-height: 100%;`;
      const svgViewBox = isSemi ? semiGeometry.viewBox : '0 0 100 100';

      const actualDonutBg = donut.cardBackgroundColor || cardBackgroundColor;
      const actualDonutAccent = donut.accentColor || primaryColor;

      dax += `
    "<div class='v-item' style='${gridStyle} --accent: ${actualDonutAccent}; --accent-bar: ${actualDonutAccent}; background: ${actualDonutBg};'>
        <div class='header' style='justify-content: ${flexAlign}'><div class='title' style='font-size: ${dTitleSize}px'>" & _D${di}_Tit & "</div></div>
        <div class='chart-box' style='align-items: ${isSemi ? 'flex-end' : 'center'};'>
            <div style='position: relative; ${gaugeBoxStyle}'>
                <svg viewBox='${svgViewBox}' preserveAspectRatio='xMidYMid meet' style='width: 100%; height: 100%; overflow: visible;'>" & ${chartContent} & "</svg>" & ${center} & "
            </div>
        </div>
    </div>" & `;
    });
  } else {
     // tab === 'bars' — despacho puro (ver barDaxResults acima).
     barDaxResults.forEach(r => { dax += r.html; });
  }

  dax += `"" & "</div></div>"
RETURN _CSS & _HTML`;

// --- NOVA FEATURE: INJEÇÃO DE ESTADO INVISÍVEL ---
  try {
      const stateToSave = { global, items, tab };
      // Converte o objeto para string segura (suporta acentos) e codifica em Base64
      const encodedState = btoa(encodeURIComponent(JSON.stringify(stateToSave)));
      dax += `\n\n/* [DO NOT EDIT] DAXILIZER_STATE_BEGIN\n${encodedState}\nDAXILIZER_STATE_END */`;
  } catch (e) {
      console.error("Erro ao codificar estado no DAX", e);
  }

  return dax;
};

/**
 * Fase 3: fonte única de verdade pra "quanto essa configuração custa em
 * caracteres DAX" — usada tanto pelo indicador de orçamento no Editor quanto
 * por qualquer medição futura (scripts de validação, etc.). Não reimplementa
 * uma fórmula aproximada (fixedOverhead + N*custoMedio) — chama o gerador
 * real e mede o resultado real, incluindo CSS, HTML e o blob de estado
 * injetado no fim (DAXILIZER_STATE_BEGIN/END), que também consome orçamento.
 *
 * Ver utils/visualConstants.ts (DAX_CHAR_SAFE_BUDGET / DAX_CHAR_HARD_LIMIT)
 * e TODO.md (o custo por card foi medido com os componentes desta fase —
 * mudanças no motor de geração, ex. Fase 4, podem alterar esse número).
 */
export function getGeneratedDaxLength(global: GlobalConfig, items: any[], tab: AppTab = 'cards'): number {
  return generateDAX(global, items, tab).length;
}