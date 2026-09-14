// utils/daxParser.ts
import { GlobalConfig, CardConfig, AppTab } from '../types';

/**
 * v0.4.0 - Função helper para extrair CSS variables do DAX
 * Busca padrões como: --p-primary: #6366f1
 */
const extractCSSVariables = (daxText: string): Record<string, string> => {
  const cssVars: Record<string, string> = {};
  const cssMatches = daxText.match(/--[\w-]+:\s*([^;}"]+)/g) || [];

  cssMatches.forEach((match: string) => {
    const [varName, varValue] = match.split(':').map(s => s.trim());
    if (varName && varValue) {
      cssVars[varName] = varValue;
    }
  });

  return cssVars;
};

/**
 * v0.4.0 - Função helper para extrair informações de customização de cards
 * Analisa CSS inline dos cards para recuperar cores, tamanhos, etc
 */
const extractCardCustomizations = (daxText: string): Record<string, any> => {
  const customizations: Record<string, any> = {};

  // Tenta extrair estilos inline dos cards
  const styleMatches = daxText.matchAll(/style='([^']*)/g);
  for (const match of styleMatches) {
    const styles = match[1];

    // Extrai font-size
    const fontSizeMatch = styles.match(/font-size:\s*(\d+)px/);
    if (fontSizeMatch) customizations.fontSize = parseInt(fontSizeMatch[1]);

    // Extrai color
    const colorMatch = styles.match(/color:\s*(#[a-f0-9]{6})/i);
    if (colorMatch) customizations.color = colorMatch[1];

    // Extrai background
    const bgMatch = styles.match(/background:\s*(#[a-f0-9]{6})/i);
    if (bgMatch) customizations.background = bgMatch[1];
  }

  return customizations;
};

/**
 * v0.4.0 - Estratégia de merge inteligente de estados
 * Prioriza: Restaurado > Estimado > Default
 */
const mergeWithFallback = (
  restored: any,
  estimated: any,
  defaults: any
): { data: any; estimatedCount: number } => {
  const merged = { ...defaults };
  let estimatedCount = 0;

  for (const key in restored) {
    if (restored[key] !== null && restored[key] !== undefined) {
      merged[key] = restored[key];
    }
  }

  for (const key in estimated) {
    if (!merged[key] && estimated[key] !== null && estimated[key] !== undefined) {
      merged[key] = estimated[key];
      estimatedCount++;
    }
  }

  return { data: merged, estimatedCount };
};

export const parseDaxToState = (daxText: string, defaultGlobal: GlobalConfig) => {
    // 1. TENTATIVA A: Restauração Perfeita (DAXILIZER_STATE)
    const stateRegex = /DAXILIZER_STATE_BEGIN\n(.*?)\nDAXILIZER_STATE_END/s;
    const match = daxText.match(stateRegex);
    
    if (match && match[1]) {
        try {
            const decodedJson = decodeURIComponent(atob(match[1].trim()));
            const state = JSON.parse(decodedJson);
            return {
                success: true,
                type: 'perfect',
                tab: state.tab as AppTab,
                global: state.global as GlobalConfig,
                items: state.items
            };
        } catch (e) {
            console.error("Falha ao ler estado Base64. Tentando Regex fallback.", e);
        }
    }

    // 2. TENTATIVA B: Restauração Legada + Reverse Engineering Avançado (v0.4.0)
    try {
        let newGlobal = { ...defaultGlobal };
        let newCards: CardConfig[] = [];

        // Extrai Cores Globais Antigas
        const getVarStr = (name: string) => {
            const m = daxText.match(new RegExp(`VAR ${name}\\s*=\\s*"(.*?)"`));
            return m ? m[1] : null;
        };
        if (getVarStr('_CorPrimaria')) newGlobal.primaryColor = getVarStr('_CorPrimaria')!;
        if (getVarStr('_CorPos')) newGlobal.positiveColor = getVarStr('_CorPos')!;
        if (getVarStr('_CorNeg')) newGlobal.negativeColor = getVarStr('_CorNeg')!;

        // v0.4.0 - Extrai CSS Variables para recuperar customizações
        const cssVars = extractCSSVariables(daxText);
        const cardCustomizations = extractCardCustomizations(daxText);

        // Tenta restaurar cores customizadas do CSS
        if (cssVars['--p-primary']) newGlobal.primaryColor = cssVars['--p-primary'];
        if (cssVars['--p-bg']) newGlobal.cardBackgroundColor = cssVars['--p-bg'];
        if (cardCustomizations.fontSize) newGlobal.fontSizeValue = cardCustomizations.fontSize;
        if (cardCustomizations.color) newGlobal.textColorValue = cardCustomizations.color;

        // Extrai Cards Antigos
        const isCards = daxText.includes('VAR _C1_Tit');
        if (isCards) {
            let i = 1;
            while (daxText.includes(`VAR _C${i}_Tit`)) {
                const title = getVarStr(`_C${i}_Tit`) || `Recuperado ${i}`;
                
                // Extrai Medida Crua (ex: [Total Vendas])
                const valRawMatch = daxText.match(new RegExp(`VAR _C${i}_Val_Raw\\s*=\\s*(.*?)\\n`));
                const measurePlaceholder = valRawMatch ? valRawMatch[1].trim() : '[Medida]';

                const hasProgress = daxText.includes(`VAR _C${i}_Prog_Val`);

                newCards.push({
                    id: Math.random().toString(36).substr(2, 9),
                    title,
                    measurePlaceholder,
                    type: hasProgress ? 'progress' : 'simple',
                    formatType: 'decimal', decimalPlaces: 0, prefix: '', suffix: '',
                    value: 'R$ 0', targetMeasurePlaceholder: '1', progressValue: 50,
                    icon: 'chart', iconPosition: 'top', iconSize: 40, iconPadding: 8, iconRounded: false, isOpen: false, comparisons: [], colSpan: 1, rowSpan: 1
                });

                // Extrai Comparativos do Card
                let cp = 1;
                while (daxText.includes(`VAR _C${i}_Comp${cp}_Lab`)) {
                    const cLab = getVarStr(`_C${i}_Comp${cp}_Lab`) || `Comp ${cp}`;
                    const cRawMatch = daxText.match(new RegExp(`VAR _C${i}_Comp${cp}_Val_Raw\\s*=\\s*(.*?)\\n`));
                    const cRaw = cRawMatch ? cRawMatch[1].trim() : '[Variacao]';

                    newCards[newCards.length - 1].comparisons.push({
                        id: Math.random().toString(36).substr(2, 9),
                        label: cLab, value: '0%', trend: 'up', logic: 'TRUE()', measurePlaceholder: cRaw, invertColor: false
                    });
                    cp++;
                }
                i++;
            }

            // v0.4.0 - Contar quantos valores foram estimados vs restaurados
            const estimatedCount = Object.keys(cardCustomizations).length;

            return {
                success: true,
                type: 'legacy',
                tab: 'cards' as AppTab,
                global: newGlobal,
                items: newCards,
                estimatedCount, // Novo campo para informar ao usuário
                estimatedFields: Object.keys(cardCustomizations) // Quais campos foram estimados
            };
        }

        return { success: false, error: "Nenhum formato DAX reconhecido." };

    } catch (e) {
        return { success: false, error: "Falha na engenharia reversa do DAX." };
    }
};

/**
 * v0.4.0 - Nova função para avisar o usuário sobre valores estimados
 * Usado quando DAX é importado e alguns valores precisam ser restaurados
 */
export const createImportWarning = (estimatedCount: number, estimatedFields: string[]): string => {
    if (estimatedCount === 0) {
        return "✅ Importado com sucesso! Estado restaurado completamente.";
    }

    const fieldList = estimatedFields.join(", ") || "valores customizados";
    return `⚠️ Importado com sucesso, mas ${estimatedCount} ${estimatedCount === 1 ? "valor foi" : "valores foram"} estimados (${fieldList}). Revise antes de usar.`;
};