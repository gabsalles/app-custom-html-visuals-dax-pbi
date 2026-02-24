import { GlobalConfig, CardConfig, AppTab } from '../types';
import { iconPaths } from './icons';

export const generateDAX = (global: GlobalConfig, items: any[], tab: AppTab = 'cards'): string => {
  const { 
    columns, gap, padding, 
    primaryColor, cardBackgroundColor,
    textColorTitle, textColorValue, textColorSub,
    positiveColor, negativeColor,
    animation, animationDuration, hoverEffect, borderRadius, cardMinHeight, 
    fontSizeTitle, fontSizeValue, fontSizeSub, fontSizeBadge,
    fontWeightTitle, fontWeightValue, textAlign,
    shadowIntensity, shadowBlur, shadowDistance
  } = global;

  const isCompact = cardMinHeight < 140;

  const getFormatString = (type: string, decimals: number): string => {
    const zeros = decimals > 0 ? "." + "0".repeat(decimals) : "";
    switch (type) {
      case 'integer': return "#,##0";
      case 'decimal': return `#,##0${zeros}`;
      case 'currency': return `"R$ " #,##0${zeros}`; 
      case 'currency_short': return `"R$ " #,0.0,, "M"`;
      case 'short': return `#,0.0,, "M"`;
      case 'percent': return `0${zeros}%`;
      default: return "";
    }
  };

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
    animationCSS = `.animate { animation: fadeInUp ${dur} ease-out forwards; opacity: 0; } @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  } else if (animation === 'popIn') {
    animationCSS = `.animate { animation: popIn ${dur} cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; } @keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }`;
  } else if (animation === 'slideRight') {
    animationCSS = `.animate { animation: slideRight ${dur} ease-out forwards; opacity: 0; } @keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }`;
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
VAR _CorNeu      = "${global.neutralColor || '#9ca3af'}"
`;

  // === GERAÇÃO DE VARIÁVEIS DAX ===
  if (tab === 'cards') {
    (items || []).forEach((card, cIdx) => {
      const ci = cIdx + 1;
      const formatStr = getFormatString(card.formatType, card.decimalPlaces);
      
      dax += `VAR _C${ci}_Tit = "${card.title}"\n`;
      dax += `VAR _C${ci}_Val_Raw = ${card.measurePlaceholder || "0"}\n`;
      
      if (card.formatType === 'none') {
          dax += `VAR _C${ci}_Val = "${card.prefix || ''}" & _C${ci}_Val_Raw & "${card.suffix || ''}"\n`;
      } else {
          dax += `VAR _C${ci}_Val = "${card.prefix || ''}" & FORMAT(_C${ci}_Val_Raw, "${formatStr}") & "${card.suffix || ''}"\n`;
      }
      
      if (card.type === 'progress') {
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
  } else {
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
  }

  // === GERAÇÃO DO CSS ===
  dax += `
VAR _CSS = "
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { margin: 0; padding: 0; background: transparent; font-family: 'Inter', -apple-system, sans-serif; overflow: hidden; }
    
    .container { 
        display: grid; 
        grid-template-columns: repeat(${columns}, 1fr); 
        grid-auto-rows: 1fr; /* IMPORTANTE: Garante que as linhas estiquem para ocupar espaço */
        gap: ${gap}px; 
        padding: ${padding}px;
        width: 100vw; height: 100vh; box-sizing: border-box;
    }
    
    .v-item { 
        background: ${cardBackgroundColor}; 
        border-radius: ${borderRadius}px; 
        padding: ${padding}px; 
        border: 1px solid rgba(0,0,0,0.06);
        display: flex; 
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
        position: relative; overflow: hidden;
        min-height: ${cardMinHeight}px;
        box-shadow: ${shadowCSS};
    }
    .v-item::before { 
        content: ''; position: absolute; left: 0; top: 15%; bottom: 15%; width: 5px; 
        background: var(--accent); border-radius: 0 100px 100px 0; 
        display: var(--accent-display, block);
    }
    ${hoverCSS} ${animationCSS}
    
    .title { text-transform: uppercase; font-size: ${fontSizeTitle}px; font-weight: ${fontWeightTitle}; color: ${textColorTitle}; letter-spacing: 0.1em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
    .value { font-size: ${fontSizeValue}px; font-weight: ${fontWeightValue}; color: ${textColorValue}; white-space: nowrap; }
    
    .row { display: flex; justify-content: ${isCompact ? 'flex-end' : 'space-between'}; align-items: center; font-weight: 600; color: ${textColorSub}; gap: 6px; }
    .row-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }    
    .badge { 
      font-size: ${fontSizeBadge || 10}px; padding: 3px 8px; border-radius: 6px; font-weight: 800; display: flex; align-items: center; gap: 4px; letter-spacing: -0.02em;
    }
    .badge svg { width: 12px; height: 12px; stroke-width: 2.5; }
    .icon-box { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .progress-track { width: 100%; background: #f3f4f6; border-radius: 100px; overflow: hidden; }
    .progress-fill { height: 100%; background: var(--accent); border-radius: 100px; transition: width 1s ease; }
    
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
    ${cssCompacto}
</style>"

VAR _HTML = "<div class='container'>" & 
`;

// === GERAÇÃO DO HTML (Cards ou Charts) ===
    if (tab === 'cards') {
      (items || []).forEach((card, idx) => {
        const ci = idx + 1;
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

        // NOVO: Construtor de array limpo para os comparativos
        let compsDAX = "";
        if (card.comparisons && card.comparisons.length > 0) {
            const compsList = card.comparisons.map((c, cpIdx) => {
                const cpi = cpIdx + 1;
                const trueColor = c.invertColor ? "_CorNeg" : "_CorPos";
                const falseColor = c.invertColor ? "_CorPos" : "_CorNeg"; 
                const trendUp = iconPaths['trendingUp'];
                const trendDown = iconPaths['trendingDown'];
                const iconSvg = `<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round'><path d='" & IF(_C${ci}_Comp${cpi}_Log, "${trendUp}", "${trendDown}") & "'/></svg>`;

                return `"<div class='row' style='font-size: ${c.labelFontSize || fSub}px;'><span class='row-label' style='color: ${c.labelColor || textColorSub}'>${c.label}</span><span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor}, ${falseColor}) & "; background-color: " & IF(_C${ci}_Comp${cpi}_Log, ${trueColor} & "1A", ${falseColor} & "1A") & ";'>${iconSvg} " & _C${ci}_Comp${cpi}_Val & "</span></div>"`;
            });
            compsDAX = `" & ${compsList.join(" & ")} & "`;
        }

        // Resolve a cor exata no JS em vez de usar DAX IF(ISBLANK)
        const actualCardBg = card.cardBackgroundColor || cardBackgroundColor;
        const actualAccent = card.accentColor || primaryColor;
        
        const gridStyle = `grid-column: span ${colSpan}; grid-row: span ${rowSpan};`;

        if (isCompact) {
            let visualHtml = "";
            if (card.type === 'progress') {
              const progColor = card.progressColor || card.accentColor ? (card.progressColor || card.accentColor) : 'var(--accent)';
              visualHtml = `" & "<div class='progress-bar-bottom' style='width: " & (_C${ci}_Prog_Pct * 100) & "%; background: ${progColor};'></div>" & "`;
            }

            dax += `
            "<div class='v-item animate' style='${gridStyle} animation-delay: ${delay}s; --accent: ${actualAccent}; background: ${actualCardBg};'>
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
                headerHTML = `<div class='header' style='flex-direction: column; align-items: ${colAlign}; justify-content: center'>${iconHTML} <div class='title' style='font-size: ${fTitle}px; margin-top: 4px;'>" & _C${ci}_Tit & "</div></div>`;
            } else if (iconPos === 'left') {
                headerHTML = `<div class='header' style='justify-content: ${flexAlign}'>${iconHTML} <div class='title' style='font-size: ${fTitle}px;'>" & _C${ci}_Tit & "</div></div>`;
            } else { 
                headerHTML = `<div class='header' style='justify-content: space-between'><div class='title' style='font-size: ${fTitle}px;'>" & _C${ci}_Tit & "</div> ${iconHTML}</div>`;
            }

            let progressHTML = "";
            if (card.type === 'progress') {
              const progColor = card.progressColor || card.accentColor ? (card.progressColor || card.accentColor) : 'var(--accent)';
              progressHTML = `" & "<div class='progress-track' style='height: ${card.progressHeight || 8}px; background: ${card.progressBackgroundColor || '#f3f4f6'}; margin-top: auto;'><div class='progress-fill' style='width: " & (_C${ci}_Prog_Pct * 100) & "%; background: ${progColor};'></div></div>" & "`;
            }

            const contentHTML = `
              <div class='content-box' style='display: flex; flex-direction: column; flex: 1;'>
                  <div class='value' style='text-align: ${align}; font-size: ${fValue}px;'>" & _C${ci}_Val & "</div>${progressHTML}
              </div>
            `;

            dax += `
              "<div class='v-item animate' style='${gridStyle} animation-delay: ${delay}s; --accent: ${actualAccent}; background: ${actualCardBg};'>
                  <div class='content-wrapper'>
                      ${headerHTML}
                      ${contentHTML}
                  </div>
                  <div class='footer'>${compsDAX}</div>
              </div>" & `;
        }
      });
  } else { 
     // === LOGICA DO GRÁFICO (CHART) ===
     (items || []).forEach((donut, idx) => {
      const di = idx + 1;
      const flexAlign = getFlexAlign(donut.textAlign || textAlign);
      const isSemi = donut.geometry === 'semicircle';
      const radius = 40;
      const circ = 2 * Math.PI * radius;
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
      
      const centerTop = isSemi ? "65%" : "50%";
      const fLabel = donut.fontSizeLabel || 9;
      const fVal = donut.fontSizeValue || 16;
      const dTitleSize = donut.fontSizeTitle || fontSizeTitle;

      // Controle de Tamanho (Chart Size)
      const sizePct = donut.chartSize || 90;

      const center = donut.showCenterText ? `"<div class='center-text' style='top: ${centerTop}; left: 50%; transform: translate(-50%, -50%);'><div style='font-size: ${fLabel}px; font-weight: 800; color: ${textColorSub}; text-transform: uppercase; letter-spacing: 0.05em;'>${donut.centerTextLabel}</div><div style='font-size: ${fVal}px; font-weight: 800; color: ${textColorValue}; margin-top: 2px;'>" & _D${di}_CenterVal & "</div></div>"` : '""';
      const svgMaxH = isSemi ? "60%" : "100%";
      const svgMargin = isSemi ? "margin-top: 10px;" : "";

      const actualDonutBg = donut.cardBackgroundColor || cardBackgroundColor;
      const actualDonutAccent = donut.accentColor || primaryColor;

      dax += `
    "<div class='v-item' style='${gridStyle} --accent: ${actualDonutAccent}; background: ${actualDonutBg};'>
        <div class='header' style='justify-content: ${flexAlign}'><div class='title' style='font-size: ${dTitleSize}px'>" & _D${di}_Tit & "</div></div>
        <div class='chart-box' style='align-items: ${isSemi ? 'flex-end' : 'center'};'>
            <svg viewBox='0 0 100 100' preserveAspectRatio='xMidYMid meet' style='width: ${sizePct}%; height: ${sizePct}%; max-width: 100%; max-height: ${svgMaxH}; ${svgMargin} overflow: visible;'>" & ${chartContent} & "</svg>" & ${center} & "
        </div>
    </div>" & `;
    });
  }

  dax += `"" & "</div>"
RETURN _CSS & _HTML`;

  return dax;
};