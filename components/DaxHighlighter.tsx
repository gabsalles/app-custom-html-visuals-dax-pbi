import React, { useMemo } from 'react';

interface DaxHighlighterProps {
  code: string;
}

const DaxHighlighter: React.FC<DaxHighlighterProps> = ({ code }) => {
  const highlightedCode = useMemo(() => {
    // Regex Patterns para DAX
    const patterns = [
      { type: 'comment', regex: /(--.*$)|(\/\/.*$)|(\/\*[\s\S]*?\*\/)/gm, color: '#6A9955' }, // Verde Comentário
      { type: 'string', regex: /"(?:[^"\\]|\\.)*"/g, color: '#CE9178' }, // Laranja String
      { type: 'measure', regex: /\[[^\]]+\]/g, color: '#9CDCFE' }, // Azul Claro Medida
      { type: 'variable', regex: /\b(VAR|RETURN|MEASURE|COLUMN|TABLE)\b/gi, color: '#569CD6' }, // Azul Escuro Keyword
      { type: 'function', regex: /\b(CALCULATE|DIVIDE|SUM|MAX|MIN|AVERAGE|COUNT|ISBLANK|FORMAT|SELECTEDVALUE|IF|SWITCH|TRUE|FALSE|BLANK|ALL|FILTER|VALUES|DISTINCT|RELATED)\b/gi, color: '#C586C0' }, // Roxo Função
      { type: 'operator', regex: /(=|<>|>=|<=|>|<|&|\+|-|\*|\/|IN|NOT|AND|OR)/gi, color: '#D4D4D4' }, // Operadores
      { type: 'number', regex: /\b\d+(\.\d+)?\b/g, color: '#B5CEA8' }, // Verde Claro Números
    ];

    let parts: { text: string; color: string }[] = [{ text: code, color: '#D4D4D4' }];

    patterns.forEach(({ regex, color }) => {
      const newParts: { text: string; color: string }[] = [];
      
      parts.forEach((part) => {
        if (part.color !== '#D4D4D4') {
          newParts.push(part); // Já foi colorida, mantém
          return;
        }

        let lastIndex = 0;
        let match;
        
        // Reset regex state
        const re = new RegExp(regex);

        while ((match = re.exec(part.text)) !== null) {
          if (match.index > lastIndex) {
            newParts.push({ text: part.text.slice(lastIndex, match.index), color: '#D4D4D4' });
          }
          newParts.push({ text: match[0], color });
          lastIndex = re.lastIndex;
        }

        if (lastIndex < part.text.length) {
          newParts.push({ text: part.text.slice(lastIndex), color: '#D4D4D4' });
        }
      });

      parts = newParts;
    });

    return parts;
  }, [code]);

  return (
    <pre className="font-mono text-[12px] leading-relaxed whitespace-pre-wrap bg-[#1E1E1E] text-[#D4D4D4] p-6 rounded-xl border border-white/10 shadow-inner overflow-auto h-full custom-scrollbar">
      {highlightedCode.map((part, i) => (
        <span key={i} style={{ color: part.color }}>{part.text}</span>
      ))}
    </pre>
  );
};

export default DaxHighlighter;