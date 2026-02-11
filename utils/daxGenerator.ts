
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
    case 'lift': hoverCSS = `.card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); border-color: rgba(0,0,0,0.08); }`; break;
    case 'scale': hoverCSS = `.card:hover { transform: scale(1.02); }`; break;
    case 'glow': hoverCSS = `.card:hover { box-shadow: 0 0 20px var(--card-accent)33; }`; break;
    case 'border': hoverCSS = `.card:hover { border-color: var(--card-accent); border-width: 2px; }`; break;
  }

  let dax = `Visual_Gerado = 
/*
================================================================================
   MANUAL DE CONFIGURAÇÃO - CARDS HTML BRADESCO PRO V3.5 (RESPONSIVE PRO)
================================================================================
   1. Crie uma NOVA MEDIDA e cole este código completo.
   2. No bloco 'DADOS DOS CARDS', procure pelos marcadores '<--- SUBSTITUA'.
   3. Substitua os [Placeholders] pelas suas medidas reais do modelo.
   4. Configure o visual 'HTML Content':
      - Values: arraste esta medida.
      - Desabilite: 'Padding' e 'Background' nas opções do visual nativo.
================================================================================
*/

-- [ SEÇÃO 1: DESIGN E CORES GLOBAIS ]
VAR _CorPrimariaGlobal = "${primaryColor}"
VAR _CorPos            = "${positiveColor}"
VAR _CorNeg            = "${negativeColor}"
VAR _CorNeu            = "${neutralColor}"

-- [ SEÇÃO 2: DADOS DOS CARDS ]
`;

  cards.forEach((card, cIdx) => {
    const ci = cIdx + 1;
    const formatStr = getFormatString(card.formatType, card.decimalPlaces);
    
    dax += `-- --- CARD ${ci}: ${card.title || "Métrica"} ---\n`;
    dax += `VAR _C${ci}_Tit = "${card.title}"\n`;
    dax += `VAR _C${ci}_Val_Raw = ${card.measurePlaceholder || "0"} -- <--- SUBSTITUA PELO VALOR PRINCIPAL\n`;
    
    // Cores Individuais
    dax += `VAR _C${ci}_Accent = ${card.accentColor ? `"${card.accentColor}"` : "_CorPrimariaGlobal"}\n`;
    dax += `VAR _C${ci}_Bg = ${card.cardBackgroundColor ? `"${card.cardBackgroundColor}"` : `"${cardBackgroundColor}"`}\n`;
    dax += `VAR _C${ci}_CTit = ${card.textColorTitle ? `"${card.textColorTitle}"` : `"${textColorTitle}"`}\n`;
    dax += `VAR _C${ci}_CVal = ${card.textColorValue ? `"${card.textColorValue}"` : `"${textColorValue}"`}\n`;
    dax += `VAR _C${ci}_CSub = ${card.textColorSub ? `"${card.textColorSub}"` : `"${textColorSub}"`}\n`;

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
      dax += `VAR _C${ci}_Target = ${card.targetMeasurePlaceholder || "1"} -- <--- SUBSTITUA PELO ALVO/META\n`;
      dax += `VAR _C${ci}_Pct = DIVIDE(_C${ci}_Val_Raw, _C${ci}_Target, 0)\n`;
    }

    card.comparisons.forEach((comp, cpIdx) => {
      const cpi = cpIdx + 1;
      dax += `VAR _C${ci}_Comp${cpi}_Lab = "${comp.label}"\n`;
      dax += `VAR _C${ci}_Comp${cpi}_Val_Raw = ${comp.measurePlaceholder || "0"} -- <--- SUBSTITUA PELA MEDIDA DO COMPARATIVO\n`;
      dax += `VAR _C${ci}_Comp${cpi}_Val = IF(ISBLANK(_C${ci}_Comp${cpi}_Val_Raw), "0%", FORMAT(_C${ci}_Comp${cpi}_Val_Raw, "+0.0%;-0.0%;0%"))\n`;
      if (comp.trend !== 'none') {
        dax += `VAR _C${ci}_Comp${cpi}_Log = ${comp.logic} -- <--- LÓGICA DE TENDÊNCIA (V/F)\n`;
      }
    });
    dax += `\n`;
  });

  dax += `
-- [ SEÇÃO 3: ESTRUTURA VISUAL ]
VAR _CSS = "
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; }
    html, body { 
        height: 100vh; 
        margin: 0; 
        padding: 0; 
        overflow: hidden; 
        background: transparent !important; 
        font-family: 'Bradesco Sans', 'Inter', sans-serif;
    }
    .container { 
        display: grid; 
        grid-template-columns: repeat(${columns}, 1fr); 
        gap: ${gap}px; 
        padding: ${padding}px;
        width: 100%; 
        height: 100vh;
        box-sizing: border-box;
    }
    .card { 
        border-radius: ${borderRadius}px; 
        padding: ${padding}px; 
        border: 1px solid rgba(0,0,0,0.05); 
        display: flex; flex-direction: column; 
        transition: all 0.3s ease; position: relative; overflow: hidden;
        min-height: ${cardMinHeight}px;
        container-type: size;
    }
    .card::before { 
        content: ''; position: absolute; left: 0; top: 15px; bottom: 15px; width: 4px; 
        background: var(--card-accent); border-radius: 0 4px 4px 0; 
    }
    ${hoverCSS} ${animationCSS}
    
    .card-content { display: flex; flex-direction: column; height: 100%; width: 100%; }
    .header-body { flex: 1; display: flex; flex-direction: column; }
    
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .title { text-transform: uppercase; letter-spacing: 1px; }
    .value { margin-bottom: 4px; }
    
    .footer { 
        margin-top: auto; 
        display: flex; 
        flex-direction: column; 
        gap: 5px; 
        padding-top: 10px;
        border-top: 1px solid rgba(0,0,0,0.03);
    }
    
    @container (max-height: 180px) {
        .card-content { flex-direction: row; align-items: center; gap: 20px; }
        .header-body { border-right: 1px solid rgba(0,0,0,0.05); padding-right: 15px; }
        .footer { margin-top: 0; border-top: none; padding-top: 0; min-width: 140px; justify-content: center; }
        .track { margin: 5px 0; }
    }

    .row { display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
    .badge { font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 3px; background: rgba(0,0,0,0.03); }
    .track { width: 100%; height: 6px; background: rgba(0,0,0,0.04); border-radius: 10px; margin: 8px 0; overflow: hidden; }
    .fill { height: 100%; background: var(--card-accent); animation: loadBar 1s ease-out; }
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
            "<div class='row' style='font-size: ${fSub}px; color: " & _C${ci}_CSub & ";'>
                <span>" & _C${ci}_Comp${cpi}_Lab & "</span>
                " & ${trendPart} & "
            </div>" & `;
    });

    let visualHtml = '""';
    if (card.type === 'progress') {
      visualHtml = `"<div class='track'><div class='fill' style='width: " & MIN(100, MAX(0, _C${ci}_Pct * 100)) & "%'></div></div>"`;
    }

    const iconSvg = `"<div style='opacity:0.2;color: " & _C${ci}_CSub & ";'><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2'><path d='${iconPaths[card.icon]}'/></svg></div>"`;

    dax += `
    "<div class='card animate' style='animation-delay: ${delay}s; background: " & _C${ci}_Bg & "; --card-accent: " & _C${ci}_Accent & ";'>
        <div class='card-content'>
            <div class='header-body'>
                <div class='header'>
                    <div class='title' style='font-size: ${fTitle}px; font-weight: ${fontWeightTitle}; color: " & _C${ci}_CTit & ";'>" & _C${ci}_Tit & "</div>
                    " & ${iconSvg} & "
                </div>
                <div class='body'>
                    <div class='value' style='font-size: ${fValue}px; font-weight: ${fontWeightValue}; color: " & _C${ci}_CVal & ";'>" & _C${ci}_Val & "</div>
                    " & ${visualHtml} & "
                </div>
            </div>
            <div class='footer'>
                " & ${comparisonsHtml} "" & "
            </div>
        </div>
    </div>" & `;
  });

  dax += `"" & "</div>"
RETURN _CSS & _HTML`;

  return dax;
};
