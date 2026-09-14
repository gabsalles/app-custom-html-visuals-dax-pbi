import React from 'react';
import { CARD_TEMPLATES } from '../utils/cardTemplates';
import { X } from 'lucide-react';

interface CardTemplateGalleryProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

/**
 * CardTemplateGallery - Modal gallery for selecting card templates
 * v0.5.0 - Select from 5 professional card templates
 */
export const CardTemplateGallery: React.FC<CardTemplateGalleryProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div
        data-tutorial="template-gallery"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col cursor-default border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h2 className="text-xl font-black text-slate-900">Selecione um Template</h2>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">
              Escolha um dos 5 modelos profissionais para iniciar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARD_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onClose();
                }}
                className="group text-left p-6 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/50 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                {/* Icon + Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <span className="text-2xl">{template.name.split(' ')[0]}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-[9px] text-slate-400 uppercase tracking-tighter mt-1">
                      {template.template.type === 'progress' ? 'Barra de Progresso' : 'Card Simples'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                  {template.description}
                </p>

                {/* Details */}
                <div className="space-y-2 mb-4 pt-4 border-t border-slate-100">
                  {template.template.icon && (
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 uppercase font-bold">Ícone</span>
                      <span className="font-mono text-indigo-600">{template.template.icon}</span>
                    </div>
                  )}
                  {template.template.comparisons && template.template.comparisons.length > 0 && (
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 uppercase font-bold">Comparativos</span>
                      <span className="font-mono text-indigo-600">
                        {template.template.comparisons.length}
                      </span>
                    </div>
                  )}
                  {template.template.comparisons && template.template.comparisons.length > 0 && template.template.comparisons[0].displayMode && (
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 uppercase font-bold">Modo</span>
                      <span className="font-mono text-indigo-600">
                        {template.template.comparisons[0].displayMode}
                      </span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <div className="inline-block px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider group-hover:bg-indigo-100 transition-colors">
                  Usar Template →
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardTemplateGallery;
