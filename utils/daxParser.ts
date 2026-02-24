// utils/daxParser.ts
import { GlobalConfig, CardConfig, AppTab } from '../types';

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

    // 2. TENTATIVA B: Restauração Legada (Regex em DAX antigo)
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
            return { success: true, type: 'legacy', tab: 'cards' as AppTab, global: newGlobal, items: newCards };
        }

        return { success: false, error: "Nenhum formato DAX reconhecido." };

    } catch (e) {
        return { success: false, error: "Falha na engenharia reversa do DAX." };
    }
};