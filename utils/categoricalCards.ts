// utils/categoricalCards.ts
//
// Fase 3 (Opção 1 — toggle no CardConfig existente): transforma um card em
// modo categórico num GRUPO com mini-grid próprio (columns independente do
// canvas principal) pra renderização no preview.
//
// Revisão: a versão anterior "achatava" os slots como itens soltos no mesmo
// grid do canvas (sem como configurar quantas colunas o grupo usa). Agora o
// grupo é 1 item do grid principal (ocupa colSpan/rowSpan do card molde),
// com um mini-grid CSS interno usando categorical.columns.
//
// Decisão mantida da versão anterior: nenhum slot gerado (incluindo "Outros")
// mostra comparativos — não temos valor de teste por categoria pra eles, e
// mostrar o mesmo badge estático em todos seria enganoso. Formatação
// condicional (Fase 2) continua funcionando por slot, porque cada um tem seu
// próprio valor real.
//
// Preview-only. A geração real em produção (daxGenerator.ts, etapa 3 desta
// fase) resolve categorias de verdade via DAX, não usa nada deste arquivo.

import { CardConfig } from '../types';

export interface CategoricalGroupData {
  /** Card molde original — dono do colSpan/rowSpan/columns/id de seleção do grupo inteiro. */
  sourceCard: CardConfig;
  groupLabel: string;
  /** Cards sintéticos, um por categoria (+ "Outros" se aplicável), na ordem final de exibição. */
  slots: CardConfig[];
}

export type RenderItem =
  | { kind: 'card'; card: CardConfig }
  | { kind: 'group'; data: CategoricalGroupData };

export interface BuildRenderItemsResult {
  items: RenderItem[];
  /** testValues original + uma entrada por slot sintético (chave = id sintético do slot). */
  effectiveTestValues: Record<string, number>;
}

export function buildRenderItems(
  cards: CardConfig[],
  testValues: Record<string, number>
): BuildRenderItemsResult {
  const items: RenderItem[] = [];
  const effectiveTestValues: Record<string, number> = { ...testValues };

  for (const card of cards) {
    if (!card.categorical) {
      items.push({ kind: 'card', card });
      continue;
    }

    const cat = card.categorical;
    const names = cat.testCategories || [];
    const entries = names.map((name, i) => ({
      name,
      value: testValues[`${card.id}_cat_${i}`] ?? 0,
    }));

    if (cat.sortBy === 'value_desc') entries.sort((a, b) => b.value - a.value);
    else if (cat.sortBy === 'value_asc') entries.sort((a, b) => a.value - b.value);
    else if (cat.sortBy === 'alpha') entries.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    const included = entries.slice(0, cat.maxSlots);
    const excluded = entries.slice(cat.maxSlots);

    // colSpan/rowSpan do molde são sobre o espaço que o GRUPO INTEIRO ocupa no
    // grid principal — não fazem sentido reaplicados a cada slot dentro do
    // mini-grid do próprio grupo. Slots são sempre 1x1 ali dentro.
    const slots: CardConfig[] = included.map((entry, i) => {
      const slotId = `${card.id}__slot_${i}`;
      effectiveTestValues[slotId] = entry.value;
      return { ...card, id: slotId, title: entry.name, comparisons: [], categorical: undefined, colSpan: 1, rowSpan: 1 };
    });

    if (cat.showOthersBucket && excluded.length > 0) {
      const slotId = `${card.id}__slot_others`;
      const othersTotal = excluded.reduce((sum, e) => sum + e.value, 0);
      effectiveTestValues[slotId] = othersTotal;
      slots.push({
        ...card, id: slotId, title: 'Outros', comparisons: [],
        conditionalRules: undefined, categorical: undefined, colSpan: 1, rowSpan: 1,
      });
    }

    items.push({
      kind: 'group',
      data: {
        sourceCard: card,
        groupLabel: `📊 Grupo: ${card.title || 'Categoria'} (${slots.length} card${slots.length !== 1 ? 's' : ''})`,
        slots,
      },
    });
  }

  return { items, effectiveTestValues };
}
