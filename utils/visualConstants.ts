// utils/visualConstants.ts
//
// Fase 0.6: fonte única para números "mágicos" que components/Preview.tsx
// (React, WYSIWYG do editor) e utils/daxGenerator.ts (string DAX que gera o
// HTML de produção no Power BI) precisam manter idênticos. Os dois arquivos
// rodam no mesmo bundle TS/Vite em tempo de geração — não há impedimento
// técnico a importar estas constantes diretamente nos dois.
//
// O que NÃO está aqui: valores computados em tempo de execução *dentro do
// Power BI* (fórmulas DAX como MIN/MAX/DIVIDE, ex.: _D{di}_Pct). Esses não
// podem virar uma constante JS compartilhada porque um lado roda no browser
// (preview, calculado em JS) e o outro é avaliado pelo motor DAX do Power BI
// (produção, calculado em texto DAX). Nesses casos a mesma lógica é escrita
// duas vezes — uma em JS, uma em DAX — e documentada com comentários
// cruzados apontando um lado para o outro, não centralizada aqui.

/**
 * Breakpoints do grid responsivo (@container), usados em Preview.tsx
 * (.p-container) e daxGenerator.ts (.container).
 */
export const CONTAINER_BREAKPOINT_TABLET_PX = 800;
export const CONTAINER_BREAKPOINT_MOBILE_PX = 500;

/**
 * Geometria do gráfico donut/gauge (viewBox "0 0 100 100"), usada em
 * Preview.tsx e daxGenerator.ts para calcular stroke-dasharray dos arcos.
 */
export const DONUT_RADIUS = 40;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

/**
 * Geometria do anel mini de progresso (CardType 'ring', viewBox "0 0 50 50").
 * Usada em Preview.tsx (renderRing) e daxGenerator.ts (ringHTML) — implementado
 * nos dois lados na fase isolada "item 8" (card type 'ring' ausente em produção).
 *
 * RING_CIRCUMFERENCE = 126 é 2π×20 (≈125.66) arredondado — mantido igual ao
 * valor que já estava hardcoded para não alterar o visual atual; a precisão
 * pode ser revisada como item de polimento em fase futura, não aqui.
 */
export const RING_RADIUS = 20;
export const RING_CIRCUMFERENCE = 126;

/**
 * Faixa válida do campo "Escala (Tamanho %)" no Editor — 100 é o teto real
 * que o CSS respeita (crescer além disso nunca teve efeito, só não era
 * comunicado nem validado no input); 30 evita um disco degenerado quase
 * invisível. Compartilhado entre a UI (clamp no onChange) e a leitura
 * defensiva do valor salvo (protege contra estado antigo/corrompido, ex.
 * um valor tipo 901010101 salvo antes deste fix existir).
 */
export const GAUGE_CHART_SIZE_MIN = 30;
export const GAUGE_CHART_SIZE_MAX = 100;

// ─────────────────────────────────────────────────────────────
// Fase 0.6 — itens 1-7: valores que já haviam divergido de fato entre
// Preview.tsx e daxGenerator.ts (não apenas risco futuro). Resolvidos a favor
// do valor de produção (daxGenerator.ts) em todos os 7 casos, aprovado
// explicitamente pelo usuário após recomendação item a item — ver histórico.
// ─────────────────────────────────────────────────────────────

/** Item 1: padding/radius do badge de comparativo (.p-badge / .badge). */
export const BADGE_PADDING = '3px 8px';
export const BADGE_RADIUS_PX = 6;

/**
 * Item 2: o badge não tem background fixo na classe CSS — cada instância
 * tinta o próprio fundo com a cor semântica do trend (positiva/negativa/
 * neutra) + este sufixo de alpha em hex (1A ≈ 10% de opacidade), formando
 * ex.: "#0596691A". Mesma fórmula usada em daxGenerator.ts (`${cor}1A`).
 */
export const BADGE_BG_ALPHA_HEX = '1A';

/** Item 3: tamanho/espessura do ícone de tendência dentro do badge. */
export const BADGE_ICON_SIZE_PX = 12;
export const BADGE_ICON_STROKE_WIDTH = 2.5;

/** Item 4: altura padrão da barra de progresso quando progressHeight não é definido. */
export const PROGRESS_BAR_DEFAULT_HEIGHT_PX = 8;

/** Item 5: border-radius da barra de progresso (pílula, à prova de qualquer altura configurada). */
export const PROGRESS_BAR_RADIUS_PX = 100;

/**
 * Item 6: curva de easing da animação de entrada do card. 'popIn' usa uma
 * curva com overshoot (bounce) para de fato "saltar"; fadeInUp/slideRight
 * usam um ease-out simples.
 */
export const ANIMATION_EASING_DEFAULT = 'ease-out';
export const ANIMATION_EASING_POP_IN = 'cubic-bezier(0.175, 0.885, 0.32, 1.275)';

/** Item 7: transição base do card fora do hover (hover já tinha curva consistente nos dois lados). */
export const CARD_BASE_TRANSITION = 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)';

// ─────────────────────────────────────────────────────────────
// Fase 3: orçamento de caracteres da medida DAX gerada (utils/daxGenerator.ts
// getGeneratedDaxLength). Existe pra sustentar o indicador de orçamento no
// Editor e o bloqueio de cópia acima do teto hard — ver TODO.md pra contexto
// completo de como esses números foram medidos e por que podem mudar.
// ─────────────────────────────────────────────────────────────

/**
 * Teto histórico conhecido pra medidas DAX que retornam texto. Referência,
 * não certeza absoluta — não há como confirmar contra a documentação atual
 * do Power BI neste ambiente offline. Tratado como limite "duro": acima
 * disso, a medida provavelmente falha ao ser avaliada/colada no Power BI.
 */
export const DAX_CHAR_HARD_LIMIT = 32000;

/**
 * Orçamento de segurança (75% do teto hard) — deixa margem pro CSS/wrapper
 * fixo crescer e pro resto do visual (ex. donuts na mesma medida) sem
 * empurrar o total pro teto hard. Cruzar este número dispara aviso visível;
 * cruzar o hard limit dispara o bloqueio de cópia (ver App.tsx).
 */
export const DAX_CHAR_SAFE_BUDGET = Math.round(DAX_CHAR_HARD_LIMIT * 0.75);
