import { GlobalConfig, CardConfig, ComparisonConfig } from '../types';
import { iconPaths } from './icons';

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
    case 'lift': hoverCSS = `.card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.15); border-color: ${primaryColor}; }`; break;
    case 'scale': hoverCSS = `.card:hover { transform: scale(1.03); border-color: ${primaryColor}; }`; break;
    case 'glow': hoverCSS = `.card:hover { box-shadow: 0 0 20px ${primaryColor}66; border-color: ${primaryColor}; }`; break;
    case 'border': hoverCSS = `.card:hover { border-color: ${primaryColor}; border-width: 2px; }`; break;
  }

  let dax = `Visual_Gerado = 
/* DAX Builder - Bradesco Edition */
-- CONFIGS GLOBAIS
VAR _CorPrimaria = "${primaryColor}"
VAR _CorPos      = "${positiveColor}"
VAR _CorNeg      = "${negativeColor}"
VAR _CorNeu      = "${neutralColor}"

`;

  // Processamento de Dados de Cada Card
  cards.forEach((card, cIdx) => {
    const ci = cIdx + 1;
    dax += `-- CARD ${ci}: ${card.title}\n`;
    dax += `VAR _C${ci}_Tit = "${card.title}"\n`;
    dax += `VAR _C${ci}_Val = ${card.measurePlaceholder}\n`;
    
    if (card.type !== 'simple') {
      dax += `VAR _C${ci}_Target = ${card.targetMeasurePlaceholder || "1"}\n`;
      dax += `VAR _C${ci}_Pct = DIVIDE(${card.measurePlaceholder}, _C${ci}_Target, 0)\n`;
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
    .container { display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px; width: 100%; padding: 5px; }
    @media (max-width: 480px) { .container { grid-template-columns: 1fr; } }
    .card { 
        background: ${cardBackgroundColor}; border-radius: ${borderRadius}px; padding: ${padding}px; 
        min-height: ${cardMinHeight}px; border: 1px solid rgba(0,0,0,0.08); 
        display: flex; flex-direction: column; transition: all 0.3s ease; position: relative; overflow: hidden;
    }
    .card::before { content: ''; position: absolute; left: 0; top: 15px; bottom: 15px; width: 4px; background: " & _CorPrimaria & "; border-radius: 0 4px 4px 0; }
    ${hoverCSS} ${animationCSS}
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .title { color: ${textColorTitle}; text-transform: uppercase; letter-spacing: 0.8px; }
    .value { color: ${textColorValue}; margin-bottom: 4px; line-height: 1.1; }
    .footer { margin-top: auto; display: flex; flex-direction: column; gap: 6px; }
    .row { display: flex; justify-content: space-between; align-items: center; color: ${textColorSub}; font-weight: 600; }
    .badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.03); }
    .track { width: 100%; height: 6px; background: #f0f0f0; border-radius: 10px; margin: 8px 0; overflow: hidden; }
    .fill { height: 100%; background: " & _CorPrimaria & "; animation: loadBar 1.2s ease-out forwards; }
    @keyframes loadBar { from { width: 0; } }
    .ring-box { position: relative; width: 48px; height: 48px; }
    .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
    .ring-bg { fill: none; stroke: #f0f0f0; stroke-width: 5; }
    .ring-val { fill: none; stroke: " & _CorPrimaria & "; stroke-width: 5; stroke-linecap: round; stroke-dasharray: 126; stroke-dashoffset: 126; animation: fillRing 1.2s ease-out forwards; }
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
      const trendPart = comp.trend === 'none' ? '""' : 
        `"<span class='badge' style='color: " & IF(_C${ci}_Comp${cpi}_Log, _CorPos, _CorNeg) & "'>" & IF(_C${ci}_Comp${cpi}_Log, "▲", "▼") & " " & _C${ci}_Comp${cpi}_Val & "</span>"`;
      
      comparisonsHtml += `
            "<div class='row' style='font-size: ${fSub}px;'>
                <span>" & _C${ci}_Comp${cpi}_Lab & "</span>
                " & ${trendPart} & "
            </div>" & `;
    });

    let visualHtml = '""';
    if (card.type === 'progress') {
      visualHtml = `"<div class='track'><div class='fill' style='width: " & MIN(100, MAX(0, _C${ci}_Pct * 100)) & "%'></div></div>"`;
    } else if (card.type === 'ring') {
      visualHtml = `"<div class='ring-box'><svg class='ring-svg' viewBox='0 0 50 50'><circle class='ring-bg' cx='25' cy='25' r='20'/><circle class='ring-val' cx='25' cy='25' r='20' style='--o: " & 126 - (126 * MIN(1, MAX(0, _C${ci}_Pct))) & "'/></svg><div style='position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;font-weight:800;color:${textColorValue}'>" & INT(_C${ci}_Pct * 100) & "%</div></div>"`;
    }

    const iconSvg = `<div style='opacity:0.6;color:${textColorSub}'><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='${iconPaths[card.icon]}'/></svg></div>`;

    dax += `
    "<div class='card animate' style='animation-delay: ${delay}s;'>
        <div class='header'>
            <div class='title' style='font-size: ${fTitle}px; font-weight: ${fontWeightTitle};'>" & _C${ci}_Tit & "</div>
            ${card.type === 'ring' ? visualHtml : iconSvg}
        </div>
        <div class='body'>
            <div class='value' style='font-size: ${fValue}px; font-weight: ${fontWeightValue};'>" & _C${ci}_Val & "</div>
            ${card.type === 'progress' ? visualHtml : ''}
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
