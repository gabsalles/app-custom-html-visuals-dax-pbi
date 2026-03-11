// utils/icons.ts

export type IconCategory = 
  | 'finance' | 'people' | 'legal' | 'ops' | 'tech' 
  | 'marketing' | 'health' | 'education' | 'media' | 'general';

export interface IconDef {
  path: string;
  category: IconCategory;
  tags: string[];
}

export const iconDefinitions: Record<string, IconDef> = {
  // === FINANCE & BUSINESS ===
  dollar: { path: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", category: 'finance', tags: ['money', 'price', 'currency'] },
  bank: { path: "M3 21h18M3 10h18M5 21V10M9 21V10M13 21V10M17 21V10M2 5l10-3 10 3", category: 'finance', tags: ['banco', 'instituição', 'segurança'] },
  coins: { path: "M11 15h2M8 15h2M11 11h2M8 11h2M11 7h2M8 7h2M12 21c-4.97 0-9-1.79-9-4s4.03-4 9-4 9 1.79 9 4-4.03 4-9 4z", category: 'finance', tags: ['moedas', 'cash', 'troco'] },
  wallet: { path: "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4 M4 6v12c0 1.1.9 2 2 2h14v-4 M20 12a2 2 0 0 0 0 4h2v-4h-2z", category: 'finance', tags: ['carteira', 'pagamento'] },
  credit: { path: "M1 4h22v16H1z M1 10h22", category: 'finance', tags: ['card', 'crédito', 'débito'] },
  piggy: { path: "M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-1c1 0 2 0 3 0v1a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2c3-2 4-5 4-8 0-3-1-3-3-3z", category: 'finance', tags: ['poupança', 'cofre', 'investimento'] },
  landmark: { path: "M3 21h18M3 7l9-5 9 5M4 10h16v11H4zM9 21v-4a3 3 0 0 1 6 0v4", category: 'finance', tags: ['governo', 'pilar', 'sede'] },
  receipt: { path: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z", category: 'finance', tags: ['nota', 'fiscal', 'cupom'] },
  calculator: { path: "M16 3H8a5 5 0 0 0-5 5v8a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5V8a5 5 0 0 0-5-5zM8 8h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01", category: 'finance', tags: ['cálculo', 'contas'] },
  trendingUp: { path: "M23 6l-9.5 9.5-5-5L1 18", category: 'finance', tags: ['crescimento', 'alta', 'lucro'] },
  trendingDown: { path: "M23 18l-9.5-9.5-5 5L1 6", category: 'finance', tags: ['queda', 'perda', 'prejuízo'] },
  briefcase: { path: "M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z", category: 'finance', tags: ['trabalho', 'business', 'corporativo'] },
  pie: { path: "M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z", category: 'finance', tags: ['gráfico', 'distribuição', 'share'] },
  chart: { path: "M18 20V10 M12 20V4 M6 20v-6", category: 'finance', tags: ['barras', 'analytics', 'performance'] },

  // === PEOPLE & HR ===
  users: { path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", category: 'people', tags: ['time', 'equipe', 'clientes'] },
  userPlus: { path: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 11h-6 M20 8v6", category: 'people', tags: ['contratar', 'novo', 'adicionar'] },
  userCheck: { path: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M17 11l2 2 4-4", category: 'people', tags: ['aprovado', 'verificado', 'rh'] },
  heart: { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", category: 'people', tags: ['satisfação', 'nps', 'saúde'] },
  medal: { path: "M8.21 13.89L7 23l5-3 5 3-1.21-9.11 M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z", category: 'people', tags: ['conquista', 'mérito', 'rank'] },
  trophy: { path: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34M12 14c-2.21 0-4-1.79-4-4V5h8v5c0 2.21-1.79 4-4 4z", category: 'people', tags: ['vencedor', 'sucesso', 'campeão'] },
  smile: { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01", category: 'people', tags: ['feliz', 'clima', 'feedback'] },

  // === LOGISTICS & OPS ===
  truck: { path: "M1 3h15v13H1V3zm15 8h4l3 3v2h-7v-5z M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", category: 'ops', tags: ['entrega', 'frete', 'transporte'] },
  package: { path: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12", category: 'ops', tags: ['caixa', 'estoque', 'produto'] },
  ship: { path: "M2 21c.6.5 1.2 1 2.5 1 1.4 0 2.1-1.5 3.5-1.5s2.1 1.5 3.5 1.5 2.1-1.5 3.5-1.5 2.1 1.5 3.5 1.5 2.1-1.5 3.5-1.5 1.9.5 2.5 1M19.38 20L21 7l-9-4-9 4 1.62 13", category: 'ops', tags: ['marítimo', 'importação', 'navio'] },
  plane: { path: "M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-1.2-.3-2.4.3-2.8 1.5-.3 1.2.3 2.4 1.5 2.8L11 13l-4 4-2.5-.5c-.8-.2-1.6.2-2 1-.3.8-.1 1.8.5 2.5L5 22l2-2 2.5.5c.8.2 1.6-.2 2-1 .3-.8.1-1.8-.5-2.5L8.5 14.5l8 1.8c1.2.3 2.4-.3 2.8-1.5.3-1.2-.3-2.4-1.5-2.8z", category: 'ops', tags: ['aéreo', 'viagem', 'rápido'] },
  clock: { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2", category: 'ops', tags: ['tempo', 'sla', 'atraso'] },
  mapPin: { path: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", category: 'ops', tags: ['local', 'destino', 'geografia'] },
  factory: { path: "M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v16z", category: 'ops', tags: ['indústria', 'produção', 'planta'] },

  // === TECHNOLOGY ===
  zap: { path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", category: 'tech', tags: ['energia', 'rápido', 'flash'] },
  cpu: { path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M9 9h6v6H9z M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2", category: 'tech', tags: ['processamento', 'core', 'it'] },
  database: { path: "M12 5c-5.5 0-10 1.8-10 4s4.5 4 10 4 10-1.8 10-4-4.5-4-10-4z M2 9v5c0 2.2 4.5 4 10 4s10-1.8 10-4V9 M2 14v5c0 2.2 4.5 4 10 4s10-1.8 10-4v-5", category: 'tech', tags: ['dados', 'storage', 'sql'] },
  cloud: { path: "M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z", category: 'tech', tags: ['nuvem', 'aws', 'online'] },
  code: { path: "M16 18l6-6-6-6M8 6l-6 6 6 6", category: 'tech', tags: ['dev', 'sistema', 'html'] },
  wifi: { path: "M5 12.55a11 11 0 0 1 14 0 M9 17.05a5 5 0 0 1 6 0 M12 20h.01", category: 'tech', tags: ['rede', 'internet', 'conector'] },

  // === MARKETING & SALES ===
  megaphone: { path: "M6.7 11l4.3 7 1.5-1.5L8.2 9.5M11 5h4c.2 0 .5.1.7.3L22 12l-6.3 6.7c-.2.2-.5.3-.7.3h-4c-.3 0-.5-.1-.7-.3L4 12l6.3-6.7c.2-.2.5-.3.7-.3z", category: 'marketing', tags: ['anúncio', 'promoção', 'aviso'] },
  target: { path: "M22 12a10 10 0 1 1-10-10 10 10 0 0 1 10 10z M18 12a6 6 0 1 1-6-6 6 6 0 0 1 6 6z M14 12a2 2 0 1 1-2-2 2 2 0 0 1 2 2z", category: 'marketing', tags: ['objetivo', 'meta', 'público'] },
  mail: { path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6", category: 'marketing', tags: ['email', 'contato', 'newsletter'] },
  share: { path: "M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13", category: 'marketing', tags: ['social', 'compartilhar', 'viral'] },

  // === HEALTH ===
  activity: { path: "M22 12h-4l-3 9L9 3l-3 9H2", category: 'health', tags: ['batimento', 'vital', 'saúde'] },
  cross: { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", category: 'health', tags: ['médico', 'hospital', 'proteção'] },
  pill: { path: "m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z M8.5 8.5l7 7", category: 'health', tags: ['remédio', 'farma', 'droga'] },

  // === MEDIA & UI ===
  play: { path: "M5 3l14 9-14 9V3z", category: 'media', tags: ['vídeo', 'iniciar', 'rodar'] },
  image: { path: "M3 3h18v18H3z M3 15l4-4 4 4 5-5 5 5", category: 'media', tags: ['foto', 'banner', 'galeria'] },
  camera: { path: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", category: 'media', tags: ['fotografia', 'captura'] },

  // === GENERAL ===
  home: { path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", category: 'general', tags: ['início', 'dashboard'] },
  search: { path: "M21 21l-5.2-5.2 M16.5 9.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z", category: 'general', tags: ['buscar', 'filtro'] },
  bell: { path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0", category: 'general', tags: ['alerta', 'notificação'] },
  settings: { path: "M12.22 2h-.44a2 2 0 0 0-2 1.27l-.68 2.44a12.03 12.03 0 0 0-3.47 1.45l-2.43-.66a2 2 0 0 0-2.27.86l-2.18 3.77a2 2 0 0 0 .54 2.55l2.14 1.48a10.6 10.6 0 0 0 0 3.32l-2.14 1.48a2 2 0 0 0-.54 2.55l2.18 3.77a2 2 0 0 0 2.27.86l2.43-.66a11.76 11.76 0 0 0 3.47 1.45l.68 2.44A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 2-1.27l.68-2.44a11.76 11.76 0 0 0 3.47-1.45l2.43.66a2 2 0 0 0 2.27-.86l2.18-3.77a2 2 0 0 0-.54-2.55l-2.14-1.48a11.76 11.76 0 0 0 0-3.32l2.14-1.48a2 2 0 0 0 .54-2.55l-2.18-3.77a2 2 0 0 0-2.27-.86l-2.43.66a12.03 12.03 0 0 0-3.47-1.45l-.68-2.44A2 2 0 0 0 12.22 2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", category: 'general', tags: ['ajustes', 'configuração'] },
  trash: { path: "M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6", category: 'general', tags: ['apagar', 'remover'] },
  check: { path: "M20 6L9 17l-5-5", category: 'general', tags: ['concluído', 'sim', 'validação'] },
  x: { path: "M18 6L6 18M6 6l12 12", category: 'general', tags: ['cancelar', 'não', 'fechar'] },
  plus: { path: "M12 5v14M5 12h14", category: 'general', tags: ['novo', 'adicionar', 'soma'] },
};

export const iconPaths: Record<string, string> = Object.keys(iconDefinitions).reduce((acc, key) => {
  acc[key] = iconDefinitions[key].path;
  return acc;
}, {} as Record<string, string>);

export const getIconSvg = (name: string, className: string = '') => {
  const path = iconPaths[name] || iconPaths['home'];
  return `<svg class='${className}' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${path}' /></svg>`;
};