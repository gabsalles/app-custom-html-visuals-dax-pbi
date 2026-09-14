// utils/valueFormatDax.test.ts
//
// Fase 4, Etapa 3. Testa o módulo direto, não só indiretamente via
// daxGenerator.test.ts — é o primeiro utilitário genuinamente pensado pra
// ser reaproveitado por um tipo de gráfico que não é card (spec aceita
// qualquer objeto com os 4 campos, não exige CardConfig inteiro).

import { describe, it, expect } from 'vitest';
import { getFormatString, buildValueFormatDax } from './valueFormatDax';

describe('getFormatString', () => {
  it('formatos básicos sem decimais', () => {
    expect(getFormatString('integer', 0)).toBe('#,##0');
    expect(getFormatString('percent', 0)).toBe('0%');
  });

  it('adiciona zeros de decimais quando > 0', () => {
    expect(getFormatString('decimal', 2)).toBe('#,##0.00');
    expect(getFormatString('percent', 1)).toBe('0.0%');
  });
});

describe('buildValueFormatDax', () => {
  it("formatType 'none': só prefixo/sufixo, sem FORMAT()", () => {
    const r = buildValueFormatDax('_Raw', '_Out', { formatType: 'none', decimalPlaces: 0, prefix: 'X', suffix: 'Y' });
    expect(r.dax).toBe('VAR _Out_Val = "X" & _Raw & "Y"\n');
    expect(r.valVar).toBe('_Out_Val');
  });

  it("formatType 'currency': prefixo padrão R$ quando não definido", () => {
    const r = buildValueFormatDax('_Raw', '_Out', { formatType: 'currency', decimalPlaces: 2 });
    expect(r.dax).toContain('"R$ "');
    expect(r.dax).toContain('FORMAT(_Raw, "#,##0.00")');
  });

  it("formatType 'short': gera VARs intermediárias Abs/Dyn nomeadas pelo prefixo", () => {
    const r = buildValueFormatDax('_Raw', '_Out', { formatType: 'short', decimalPlaces: 0 });
    expect(r.dax).toContain('VAR _Out_Abs = ABS(_Raw)');
    expect(r.dax).toContain('VAR _Out_Dyn = SWITCH(TRUE()');
    expect(r.dax).toContain('VAR _Out_Val =');
  });

  it('funciona com um objeto que não é CardConfig — só os 4 campos da spec', () => {
    // Prova de que a extração cumpriu o objetivo: não exige o shape de card.
    const barSpec = { formatType: 'integer' as const, decimalPlaces: 0 };
    const r = buildValueFormatDax('_BarRaw', '_Bar1', barSpec);
    expect(r.valVar).toBe('_Bar1_Val');
  });
});
