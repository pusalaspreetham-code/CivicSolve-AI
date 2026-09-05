import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check, ChevronDown, Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  variant?: 'header' | 'compact' | 'inline-banner';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'header',
  className = '' 
}) => {
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter((lang) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  if (variant === 'inline-banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-50 via-indigo-50 to-orange-50 border border-blue-200/80 rounded-xl p-3.5 sm:p-4 shadow-xs ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Globe className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Select Language / భాష ఎంచుకోండి / भाषा चुनें
                </span>
                <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-blue-100 text-blue-900 rounded">
                  22 Scheduled Languages
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Choose your mother tongue to view the form, speak, and type in your language.
              </p>
            </div>
          </div>

          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
              type="button"
              id="language-selector-banner-btn"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-800 transition-colors"
              aria-haspopup="true"
              aria-expanded={isOpen}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-base font-bold text-blue-950">{currentLanguage.nativeName}</span>
                <span className="text-xs text-slate-500 font-normal">({currentLanguage.name})</span>
              </span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isOpen && (
              <div className="absolute right-0 z-50 mt-1.5 w-72 sm:w-80 max-h-96 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xl ring-1 ring-black/5 flex flex-col">
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <input
                    type="text"
                    id="language-search-input-banner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search language / భాష శోధించండి..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-72 divide-y divide-slate-50 py-1">
                  {filteredLanguages.map((lang) => {
                    const isSelected = lang.code === currentLanguage.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold leading-tight">{lang.nativeName}</span>
                          <span className="text-[11px] text-slate-500">{lang.name} • {lang.script}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-900 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Header or compact variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        id="header-language-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 bg-white hover:bg-slate-100 active:bg-slate-200 rounded-lg border border-slate-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-800 transition-colors"
        aria-label="Select Language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-blue-900 shrink-0" />
        <span className="font-bold text-slate-900">{currentLanguage.nativeName}</span>
        <span className="hidden sm:inline text-xs text-slate-500 font-normal">({currentLanguage.name})</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-72 sm:w-80 max-h-96 overflow-hidden rounded-xl bg-white border border-slate-200 shadow-xl ring-1 ring-black/5 flex flex-col">
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" />
              India's 22 Scheduled Languages
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Total: {languages.length}</span>
          </div>

          <div className="p-2 border-b border-slate-100">
            <input
              type="text"
              id="language-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search language / భాష శోధించండి..."
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-700"
              autoFocus
            />
          </div>

          <div className="overflow-y-auto max-h-72 divide-y divide-slate-50 py-1">
            {filteredLanguages.map((lang) => {
              const isSelected = lang.code === currentLanguage.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  id={`lang-select-${lang.code}`}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold leading-tight">{lang.nativeName}</span>
                    <span className="text-[11px] text-slate-500">
                      {lang.name} {lang.isConstitutionallyScheduled && <span className="text-orange-600 font-medium">• Eighth Schedule</span>}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-900 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
