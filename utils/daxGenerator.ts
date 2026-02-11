import { GlobalConfig, CardConfig, ComparisonConfig } from '../types';
import { iconPaths } from './icons';

const getFormatString = (type: string, decimals: number): string => {
  const zeros = decimals > 0 ? "." + "0".repeat(decimals) : "";
  switch (type) {
    case 'integer': return "#,##0";
    case 'decimal': return `#,##0${zeros}`;
    case 'currency': return `"R$ " & #,##0${zeros}`;
    case 'percent': return `0${zeros}%`;
    case 'short': return "#,0.0#K"; 
    default: return "";
  }
};

export const generateDAX = (global: GlobalConfig, cards: CardConfig[]): string => {
  const { 
    columns, gap, padding, 
    primaryColor, cardBackgroundColor,
    textColorTitle, textColorValue, textColorSub,
    positiveColor, negativeColor, neutralColor,
    animation, animationDuration, hoverEffect, borderRadius, cardMinHeight, 
    fontSizeTitle, fontSizeValue, fontSizeSub,
    fontWeightTitle, fontWeightValue
  } = global;

  const dur = `${animationDuration}s`;
  let animationCSS = '';
  if (animation === 'fadeInUp') {
    animationCSS = `@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate { animation: fadeInUp ${dur} ease-out forwards; opacity: 0; }`;
  } else if (animation === 'popIn') {
    animationCSS = `@keyframes popIn { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
    .animate { animation: popIn ${dur} cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }`;
  } else if (animation === 'slideRight') {
    animationCSS = `@keyframes slideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    .animate { animation: slideRight ${dur} ease-out forwards; opacity: 0; }`;
  }

  let hoverCSS = '';
  switch (hoverEffect) {
    case 'lift': hoverCSS = `.card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.12); border-color: rgba(0,0,0,0.15); }`; break;
    case 'scale': hoverCSS = `.card:hover { transform: scale(1.03); }`; break;
    case 'glow': hoverCSS = `.card:hover { box-shadow: 0 0 20px var(--card-accent)44; }`; break;
    case 'border': hoverCSS = `.card:hover { border-color: var(--card-accent); border-width: 2px; }`; break;
  }

  let dax = `Visual_Gerado = 
/* DAX Builder - Bradesco Edition Pro v2.3 */
-- CONFIGS GLOBAIS
VAR _CorPrimariaGlobal = "${primaryColor}"
VAR _CorPos            = "${positiveColor}"
VAR _CorNeg            = "${negativeColor}"
VAR _CorNeu            = "${neutralColor}"

`;

  cards.forEach((card, cIdx) => {
    const ci = cIdx + 1;
    const formatStr = getFormatString(card.formatType, card.decimalPlaces);
    
    dax += `-- CARD ${ci}: ${card.title}\n`;
    dax += `VAR _C${ci}_Tit = "${card.title}"\n`;
    dax += `VAR _C${ci}_Val_Raw = ${card.measurePlaceholder || "0"}\n`;
    dax += `VAR _C${ci}_Accent = ${card.accentColor ? `"${card.accentColor}"` : "_CorPrimariaGlobal"}\n`;
    
    if (card.formatType !== 'none') {
        if (card.formatType === 'currency') {
            dax += `VAR _C${ci}_Val = "R$ " & FORMAT(_C${ci}_Val_Raw, "#,##0${card.decimalPlaces > 0 ? "." + "0".repeat(card.decimalPlaces) : ""}")\n`;
        } else if (card.formatType === 'currency_short') {
            dax += `VAR _C${ci}_Val = "R$ " & SWITCH(TRUE(), 
                ABS(_C${ci}_Val_Raw) >= 1000000, FORMAT(_C${ci}_Val_Raw/1000000, "#,##0${card.decimalPlaces > 0 ? "." + "0".repeat(card.decimalPlaces) : ""}M"),
                ABS(_C${ci}_Val_Raw) >= 1000, FORMAT(_C${ci}_Val_Raw/1000, "#,##0${card.decimalPlaces > 0 ? "." + "0".repeat(card.decimalPlaces) : ""}K"),
                FORMAT(_C${ci}_Val_Raw, "#,##0${card.decimalPlaces > 0 ? "." + "0".repeat(card.decimalPlaces) : ""}")
            )\n`;
        } else {
            dax += `VAR _C${ci}_Val = FORMAT(_C${ci}_Val_Raw, "${formatStr}")\n`;
        }
    } else {
        dax += `VAR _C${ci}_Val = _C${ci}_Val_Raw\n`;
    }
    
    if (card.type !== 'simple') {
      dax += `VAR _C${ci}_Target = ${card.targetMeasurePlaceholder || "1"}\n`;
      dax += `VAR _C${ci}_Pct = DIVIDE(_C${ci}_Val_Raw, _C${ci}_Target, 0)\n`;
    }

    card.comparisons.forEach((comp, cpIdx) => {
      const cpi = cpIdx + 1;
      dax += `VAR _C${ci}_Comp${cpi}_Lab = "${comp.label}"\n`;
      dax += `VAR _C${ci}_Comp${cpi}_Val = "${comp.value}"\n`;
      if (comp.trend !== 'none') {
        dax += `VAR _C${ci}_Comp${cpi}_Log = ${comp.logic}\n`;
      }
    });
    dax += `\n`;
  });

  dax += `VAR _CSS = "
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { 
        box-sizing: border-box; 
        font-family: 'Bradesco Sans', 'Inter', -apple-system, sans-serif; 
    }
    html, body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
    .container { 
        display: grid; 
        grid-template-columns: repeat(${columns}, 1fr); 
        gap: ${gap}px; 
        width: 100%; 
        height: 100%;
        padding: 20px;
    }
    @media (max-width: 480px) { .container { grid-template-columns: 1fr; } }
    .card { 
        background: ${cardBackgroundColor}; 
        border-radius: ${borderRadius}px; 
        padding: ${padding}px; 
        border: 1px solid rgba(0,0,0,0.06); 
        display: flex; 
        flex-direction: column; 
        transition: all 0.3s ease; 
        position: relative; 
        overflow: hidden;
        flex: 1;
    }
    .card::before { 
        content: ''; 
        position: absolute; 
        left: 0; 
        top: 15px; 
        bottom: 15px; 
        width: 4px; 
        background: var(--card-accent); 
        border-radius: 0 4px 4px 0; 
    }
    ${hoverCSS} ${animationCSS}
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .title { color: ${textColorTitle}; text-transform: uppercase; letter-spacing: 0.8px; }
    .value { color: ${textColorValue}; margin-bottom: 4px; line-height: 1.1; }
    .footer { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; justify-content: space-between; align-items: center; color: ${textColorSub}; font-weight: 600; }
    .badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.03); }
    .track { width: 100%; height: 6px; background: rgba(0,0,0,0.04); border-radius: 10px; margin: 8px 0; overflow: hidden; }
    .fill { height: 100%; background: var(--card-accent); animation: loadBar 1.2s ease-out forwards; }
    @keyframes loadBar { from { width: 0; } }
</style>"

VAR _HTML = "<div class='container'>" & 
`;

  cards.forEach((card, cIdx) => {
    const ci = cIdx + 1;
    const delay = (cIdx * 0.1).toFixed(1);

    const fTitle = card.fontSizeTitle || fontSizeTitle;
    const fValue = card.fontSizeValue || fontSizeValue;
    const fSub   = card.fontSizeSub   || fontSizeSub;

    let comparisonsHtml = "";
    card.comparisons.forEach((comp, cpIdx) => {
      const cpi = cpIdx + 1;
      const posCol = comp.invertColor ? '_CorNeg' : '_CorPos';
      const negCol = comp.invertColor ? '_CorPos' : '_CorNeg';

      const trendPart = comp.trend === 'none' ? '""' : 
        `"<span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, ${posCol}, ${negCol}) & "'>" & IF(_C${ci}_Comp${cpi}_Log, "▲", "▼") & " " & _C${ci}_Comp${cpi}_Val & "</span>"`;
      
      comparisonsHtml += `
            "<div class='row' style='font-size: ${fSub}px;'>
                <span>" & _C${ci}_Comp${cpi}_Lab & "</span>
                " & ${trendPart} & "
            </div>" & `;
    });

    let visualHtml = '""';
    if (card.type === 'progress') {
      visualHtml = `"<div class='track'><div class='fill' style='width: " & MIN(100, MAX(0, _C${ci}_Pct * 100)) & "%'></div></div>"`;
    }

    const iconSvg = `"<div style='opacity:0.4;color:${textColorSub}'><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='${iconPaths[card.icon]}'/></svg></div>"`;

    dax += `
    "<div class='card animate' style='animation-delay: ${delay}s; --card-accent: " & _C${ci}_Accent & ";'>
        <div class='header'>
            <div class='title' style='font-size: ${fTitle}px; font-weight: ${fontWeightTitle};'>" & _C${ci}_Tit & "</div>
            " & ${iconSvg} & "
        </div>
        <div class='body'>
            <div class='value' style='font-size: ${fValue}px; font-weight: ${fontWeightValue};'>" & _C${ci}_Val & "</div>
            " & ${visualHtml} & "
        </div>
        <div class='footer'>
            " & ${comparisonsHtml} "" & "
        </div>
    </div>" & `;
  });

  dax += `"" & "</div>"
RETURN _CSS & _HTML`;

  return dax;
};