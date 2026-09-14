// components/Preview.presence.test.ts
//
// Fase 4, Etapa 0.
//
// ⚠️ AVISO — leia antes de confiar nestes testes:
// Isto NÃO é teste comportamental. Só lê o texto-fonte de Preview.tsx e
// confirma que certas classes/trechos ainda estão presentes. Não renderiza
// nada, não executa JSX, não prova que o layout funciona visualmente — um
// componente pode ter a classe certa e ainda assim renderizar errado por
// outro motivo (CSS quebrado em outro lugar, lógica de composição errada
// etc.). É só um alarme contra deleção/edição acidental de trechos que já
// foram deliberadamente ajustados (Fase 1 item 2, Fase 3 mini-grid).
//
// Isto NÃO resolve a pendência "checagem visual real" registrada no
// TODO.md item 1 (Fase 1, item 3) nem o que falta de checagem visual do
// wrapper de grupo da Fase 3 — esses continuam abertos, sem alteração de
// status por causa deste arquivo. Ver TODO.md.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const source = readFileSync(join(__dirname, 'Preview.tsx'), 'utf-8');

describe('Fase 1 item 2 — classes de proteção de overflow do título (presença apenas)', () => {
  it('modo compact tem as classes de ellipsis + min-w-0', () => {
    expect(source).toContain('uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis min-w-0');
  });

  it('iconPosition top (coluna) tem max-w-full', () => {
    expect(source).toContain('uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis max-w-full');
  });

  it('iconPosition left/right (linha) têm min-w-0', () => {
    const occurrences = (source.match(/uppercase tracking-widest whitespace-nowrap overflow-hidden text-ellipsis min-w-0/g) || []).length;
    // 1 no modo compact (acima) + 2 no modo normal (left e right) = 3
    expect(occurrences).toBe(3);
  });
});

describe('Fase 3 — wrapper de grupo categórico (presença apenas)', () => {
  it('usa contorno tracejado no wrapper quando selecionado', () => {
    expect(source).toContain("2px dashed");
  });

  it('mini-grid usa grid-template-columns com categorical.columns', () => {
    expect(source).toContain('gridTemplateColumns: `repeat(${sourceCard.categorical?.columns || 3}, 1fr)`');
  });

  it('clique num slot redireciona pro card molde (clickId)', () => {
    expect(source).toContain('renderCardItem(slot, i, sourceCard.id)');
  });
});
