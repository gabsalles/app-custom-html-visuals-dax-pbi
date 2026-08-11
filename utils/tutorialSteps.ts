import { TutorialStep } from '../components/OnboardingTutorial';

/**
 * Tutorial steps configuration for Fase 4 - INTERACTIVE & DIDACTIC
 * v0.5.0 - Step-by-step guided experience with auto-actions
 */
export interface TutorialStepExtended extends TutorialStep {
  autoAction?: () => void; // Function to execute when step loads
  ctaText?: string; // Call-to-action button text
  ctaAction?: () => void; // Action when user clicks CTA button
  hint?: string; // Additional hint for user
}

export const TUTORIAL_STEPS: TutorialStepExtended[] = [
  {
    id: 'welcome',
    title: '🎓 Bem-vindo ao DAXILIZER!',
    description:
      'Vamos criar juntos seu primeiro card visual profissional para Power BI em apenas 5 minutos! Neste tutorial, você aprenderá a usar templates, customizar cards e exportar para o Power BI.',
    action: 'Você pronto para começar?',
    ctaText: 'Vamos lá! 🚀',
    ctaAction: undefined, // Próximo passo automático
  },

  {
    id: 'create-card',
    title: '1️⃣ Crie seu primeiro card',
    description:
      'Clique no botão "+" na seção "CAMADAS" (lado esquerdo) para criar um novo card. Uma galeria com 5 templates profissionais vai aparecer.',
    targetElement: '[data-tutorial="create-card-button"]',
    position: 'bottom',
    action: 'O botão "+" está destacado. Clique nele agora!',
    ctaText: 'Abrir galeria',
    ctaAction: () => {
      // Simula o clique no botão
      const btn = document.querySelector('[data-tutorial="create-card-button"]') as HTMLElement;
      btn?.click();
    },
    hint: 'Você pode ver o painel esquerdo com os cards existentes',
  },

  {
    id: 'select-template',
    title: '2️⃣ Escolha um template',
    description:
      'A galeria de templates está aberta! Você verá 5 opções:\n\n📊 Simple KPI - Para métricas básicas\n⬆️ Growth YoY - Para comparações anuais\n⭐ Rating - Para avaliações\n🎯 Progress - Para metas\n✅ Status - Para indicadores\n\nCada template vem pré-configurado com as melhores práticas. Selecione qualquer um para continuar.',
    targetElement: '[data-tutorial="template-gallery"]',
    position: 'top',
    action: 'Clique em qualquer template para criar o card!',
    ctaText: 'Usar "Simple KPI"',
    ctaAction: () => {
      // Simula clique no primeiro template
      const templates = document.querySelectorAll('[data-tutorial="template-gallery"] button');
      if (templates.length > 0) {
        (templates[0] as HTMLElement).click();
      }
    },
    hint: 'Cada card vem com um ícone representativo e uma descrição clara',
  },

  {
    id: 'customize-card',
    title: '3️⃣ Customize seu card',
    description:
      'Perfeito! Seu card foi criado com a configuração do template. Agora vamos customizar no painel direito:\n\n✏️ Título - Mude para algo significativo\n🎨 Cores - Ajuste a cor do card\n📊 Ícone - Escolha um ícone apropriado\n📈 Comparativos - Configure as métricas\n\nTodos esses campos estão visíveis no painel DIREITO. Explore e personalize conforme desejar!',
    targetElement: '[data-tutorial="right-panel"]',
    position: 'left',
    action: 'Edite os campos no painel direito. Comece pelo título!',
    ctaText: 'Entendi, próximo passo',
    hint: 'O painel direito é onde toda a customização acontece',
  },

  {
    id: 'copy-paste',
    title: '4️⃣ Reutilize com Copy/Paste',
    description:
      'Agora você conhece o poder do Copy/Paste! Se você tiver um card customizado que quer repetir:\n\n👆 Hover no card na lista (lado esquerdo)\n📋 Clique em [Copy] para copiar a configuração\n👉 Vá para outro card e clique em [Paste]\n✨ Toda a configuração é aplicada em 1 segundo!\n\nIsso economiza MUITO tempo quando você tem muitos cards similares.',
    targetElement: '[data-tutorial="layers-panel"]',
    position: 'right',
    action: 'Você verá os botões [Copy] e [Paste] ao passar o mouse no card',
    hint: 'Copia: título, ícone, cores, comparativos - tudo MENOS a medida (ID único)',
  },

  {
    id: 'export-dax',
    title: '5️⃣ Exporte seu DAX',
    description:
      'Agora vem a melhor parte - levar seu card para o Power BI!\n\n1️⃣ Clique na aba "DAX" (lado direito - próximo a "Visual")\n2️⃣ O código completo em DAX será gerado automaticamente\n3️⃣ Copie todo o código (Ctrl+A, Ctrl+C)\n4️⃣ Vá para seu visual no Power BI\n5️⃣ Cole o código na área de script\n6️⃣ Pronto! Seu card visual está funcionando!\n\nO código gerado já inclui todas as customizações que você fez.',
    targetElement: '[data-tutorial="export-dax-button"]',
    position: 'bottom',
    action: 'Clique no botão "DAX" para ver o código gerado',
    ctaText: 'Mostrar código DAX',
    ctaAction: () => {
      // Simula o clique no botão DAX
      const btn = document.querySelector('[data-tutorial="export-dax-button"]') as HTMLElement;
      btn?.click();
    },
    hint: 'O código é atualizado em tempo real conforme você customiza o card',
  },

  {
    id: 'complete',
    title: '✨ Parabéns! 🎉',
    description:
      'Você aprendeu tudo que precisa para criar cards profissionais no DAXILIZER!\n\n✅ Criar cards com templates\n✅ Customizar cores, ícones e medidas\n✅ Usar Copy/Paste para economizar tempo\n✅ Exportar DAX para Power BI\n\nAgora é só aproveitar e criar seus visuales! Qualquer dúvida, você pode reabrir este tutorial a qualquer hora.',
    action: 'Aproveite o DAXILIZER! 🚀',
    ctaText: 'Finalizar tutorial',
  },
];

/**
 * Check if user has completed tutorial
 */
export const isTutorialCompleted = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('daxilizer-tutorial-completed') === 'true';
};

/**
 * Mark tutorial as completed
 */
export const markTutorialCompleted = (): void => {
  localStorage.setItem('daxilizer-tutorial-completed', 'true');
};

/**
 * Reset tutorial (for testing)
 */
export const resetTutorial = (): void => {
  localStorage.removeItem('daxilizer-tutorial-completed');
};

/**
 * Get current tutorial step (for resuming)
 */
export const getTutorialStep = (): number => {
  if (typeof window === 'undefined') return 0;
  const saved = localStorage.getItem('daxilizer-tutorial-step');
  return saved ? parseInt(saved, 10) : 0;
};

/**
 * Save current tutorial step
 */
export const saveTutorialStep = (step: number): void => {
  localStorage.setItem('daxilizer-tutorial-step', step.toString());
};
