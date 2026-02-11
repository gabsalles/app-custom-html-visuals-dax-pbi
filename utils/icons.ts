// icons.ts

export type IconCategory = 'finance' | 'people' | 'legal' | 'ops' | 'tech' | 'general';

export interface IconDef {
  path: string;
  category: IconCategory;
  tags: string[];
}

export const iconDefinitions: Record<string, IconDef> = {
  // Finance & Business
  dollar: { path: "M12 1v22 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", category: 'finance', tags: ['money', 'price', 'currency', 'vendas'] },
  briefcase: { path: "M16 7V5a2 2 0 0 0-2-2H10a2 2 0 0 0-2 2v2M3 7h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z", category: 'finance', tags: ['work', 'business', 'corporate'] },
  chart: { path: "M18 20V10 M12 20V4 M6 20v-6", category: 'finance', tags: ['graph', 'analytics', 'data', 'performance'] },
  pie: { path: "M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z", category: 'finance', tags: ['chart', 'distribution', 'share'] },
  target: { path: "M22 12a10 10 0 1 1-10-10 10 10 0 0 1 10 10z M18 12a6 6 0 1 1-6-6 6 6 0 0 1 6 6z M14 12a2 2 0 1 1-2-2 2 2 0 0 1 2 2z", category: 'finance', tags: ['goal', 'kpi', 'objective'] },
  credit: { path: "M1 4h22v16H1z M1 10h22", category: 'finance', tags: ['card', 'payment', 'bank'] },
  trendingUp: { path: "M23 6l-9.5 9.5-5-5L1 18", category: 'finance', tags: ['growth', 'increase', 'profit'] },
  trendingDown: { path: "M23 18l-9.5-9.5-5 5L1 6", category: 'finance', tags: ['loss', 'decrease', 'decline'] },
  layers: { path: "M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5", category: 'finance', tags: ['stack', 'data', 'structure'] },
  wallet: { path: "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4 M4 6v12c0 1.1.9 2 2 2h14v-4 M20 12a2 2 0 0 0 0 4h2v-4h-2z", category: 'finance', tags: ['savings', 'budget', 'money'] },

  // People Analytics & RH
  users: { path: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", category: 'people', tags: ['team', 'staff', 'customers'] },
  userPlus: { path: "M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 11h-6 M20 8v6", category: 'people', tags: ['hire', 'recruit', 'add'] },
  graduation: { path: "M22 10v6M2 10l10-5 10 5-10 5-10-5zm4.5 4.5V19l5.5 3 5.5-3v-4.5", category: 'people', tags: ['education', 'training', 'learning'] },
  trophy: { path: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34M12 14c-2.21 0-4-1.79-4-4V5h8v5c0 2.21-1.79 4-4 4z", category: 'people', tags: ['award', 'winner', 'success'] },
  heart: { path: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z", category: 'people', tags: ['health', 'satisfaction', 'nps'] },

  // Jurídico & Compliance
  scale: { path: "M12 3v18M6 7l6-4 6 4M4 15a4 4 0 0 0 8 0M12 15a4 4 0 0 0 8 0M2 11h20", category: 'legal', tags: ['law', 'justice', 'balance'] },
  gavel: { path: "M14.5 12.5L20 7l-3-3-5.5 5.5M7 20l5-5M6 15l-3 3 2 2 3-3-2-2z", category: 'legal', tags: ['court', 'judge', 'legal'] },
  shield: { path: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", category: 'legal', tags: ['security', 'compliance', 'protection'] },
  fileText: { path: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8", category: 'legal', tags: ['document', 'report', 'contract'] },

  // Logística & Operações
  truck: { path: "M1 3h15v13H1V3zm15 8h4l3 3v2h-7v-5z M5.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zm12 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", category: 'ops', tags: ['delivery', 'logistics', 'shipping'] },
  package: { path: "M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12", category: 'ops', tags: ['box', 'inventory', 'stock'] },
  clock: { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2", category: 'ops', tags: ['time', 'sla', 'duration'] },
  map: { path: "M1 6v14a2 2 0 0 0 2-2V6l7 3 8-3 5 2v14a2 2 0 0 1-2 2h-1l-5-2-8 3-7-3V6z M8 3v15M16 6v15", category: 'ops', tags: ['location', 'region', 'territory'] },

  // Tecnologia
  zap: { path: "M13 2L3 14h9l-1 8 10-12h-9l1-8z", category: 'tech', tags: ['power', 'fast', 'energy'] },
  cpu: { path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M9 9h6v6H9z M15 2v2M15 20v2M9 2v2M9 20v2M2 15h2M2 9h2M20 15h2M20 9h2", category: 'tech', tags: ['processing', 'server', 'system'] },
  database: { path: "M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z M3 5c0 1.1 4 2 9 2s9-.9 9-2 M3 12c0 1.1 4 2 9 2s9-.9 9-2", category: 'tech', tags: ['data', 'storage', 'backend'] },
  
  // Geral
  home: { path: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10", category: 'general', tags: ['main', 'dashboard'] },
  bell: { path: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0", category: 'general', tags: ['alert', 'notification'] },
  search: { path: "M21 21l-5.2-5.2 M16.5 9.5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z", category: 'general', tags: ['find', 'lookup'] },
  settings: { path: "M12.22 2h-.44a2 2 0 0 0-2 1.27l-.68 2.44a12.03 12.03 0 0 0-3.47 1.45l-2.43-.66a2 2 0 0 0-2.27.86l-2.18 3.77a2 2 0 0 0 .54 2.55l2.14 1.48a10.6 10.6 0 0 0 0 3.32l-2.14 1.48a2 2 0 0 0-.54 2.55l2.18 3.77a2 2 0 0 0 2.27.86l2.43-.66a11.76 11.76 0 0 0 3.47 1.45l.68 2.44A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 2-1.27l.68-2.44a11.76 11.76 0 0 0 3.47-1.45l2.43.66a2 2 0 0 0 2.27-.86l2.18-3.77a2 2 0 0 0-.54-2.55l-2.14-1.48a11.76 11.76 0 0 0 0-3.32l2.14-1.48a2 2 0 0 0 .54-2.55l-2.18-3.77a2 2 0 0 0-2.27-.86l-2.43.66a12.03 12.03 0 0 0-3.47-1.45l-.68-2.44A2 2 0 0 0 12.22 2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", category: 'general', tags: ['config', 'options'] },
  calendar: { path: "M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18", category: 'general', tags: ['date', 'time', 'schedule'] },
  circle: { path: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z", category: 'general', tags: ['dot', 'shape'] }
};

// Mapeamento legado para compatibilidade com código existente
export const iconPaths: Record<string, string> = Object.keys(iconDefinitions).reduce((acc, key) => {
  acc[key] = iconDefinitions[key].path;
  return acc;
}, {} as Record<string, string>);

export const getIconSvg = (name: string, className: string = '') => {
  const path = iconPaths[name] || iconPaths['circle'];
  return `<svg class='${className}' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='${path}' /></svg>`;
};