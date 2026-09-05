import React, { useState } from 'react';
import { 
  Building2, 
  Menu, 
  X, 
  PlusCircle, 
  Users2, 
  FileText, 
  HelpCircle,
  ShieldCheck,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

interface HeaderProps {
  onReportClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReportClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-xs">
      {/* Top official banner bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 truncate mr-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
            <span className="font-medium tracking-wide truncate">{t('networkBanner')}</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-300 shrink-0">
            <span className="hidden md:inline text-xs flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              {t('verifiedIntake')}
            </span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <a 
              href="#" 
              id="brand-logo-link"
              className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-blue-800 rounded-md p-1"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-900 flex items-center justify-center text-white shadow-xs border border-blue-950">
                <Building2 className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900">
                    Civic<span className="text-blue-900">Solve</span>
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-800 rounded border border-orange-200 uppercase tracking-wider">
                    {t('pilotBadge')}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  {t('appTagline')}
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a 
              href="#about" 
              className="hover:text-blue-900 transition-colors flex items-center gap-1.5 py-1"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              {t('howItWorks')}
            </a>
            <a 
              href="#collaborators" 
              className="hover:text-blue-900 transition-colors flex items-center gap-1.5 py-1"
            >
              <Users2 className="w-4 h-4 text-slate-400" />
              {t('stakeholders')}
            </a>
            <a 
              href="#faq" 
              className="hover:text-blue-900 transition-colors flex items-center gap-1.5 py-1"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" />
              {t('faq')}
            </a>
          </nav>

          {/* Language Selector + Primary Action Button */}
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <LanguageSelector variant="header" />

            <div className="hidden sm:flex items-center space-x-3">
              <button
                type="button"
                id="header-report-btn"
                onClick={onReportClick}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-lg shadow-xs transition-all border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
              >
                <PlusCircle className="w-4 h-4 text-orange-400" />
                <span>{t('reportProblemBtn')}</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex lg:hidden">
              <button
                type="button"
                id="mobile-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-800"
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <a
            href="#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50"
          >
            {t('howItWorks')}
          </a>
          <a
            href="#collaborators"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50"
          >
            {t('stakeholders')}
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50"
          >
            {t('faq')}
          </a>
          <div className="pt-2">
            <button
              type="button"
              id="mobile-header-report-btn"
              onClick={() => {
                setMobileMenuOpen(false);
                onReportClick?.();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-orange-400" />
              <span>{t('reportProblemBtn')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
