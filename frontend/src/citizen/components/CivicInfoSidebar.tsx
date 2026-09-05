import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  Users, 
  ShieldCheck, 
  CheckCircle, 
  FileCheck2,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CivicInfoSidebar: React.FC = () => {
  const { t, currentLanguage } = useLanguage();

  return (
    <aside className="space-y-6" id="civic-info-sidebar">
      {/* Collaborative Network Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-900" />
          <span>{t('connectedPartners')}</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          {t('sidebarDesc')}
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900 shrink-0 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">{t('partnerGov')}</span>
              <p className="text-slate-500 text-[11px] leading-snug">
                Municipal corporations, public works, water boards, and sanitation departments.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-md bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-700 shrink-0 mt-0.5">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">{t('partnerUnis')}</span>
              <p className="text-slate-500 text-[11px] leading-snug">
                Engineering faculties and student researchers developing low-cost civic interventions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs">
            <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-800">{t('partnerNgos')}</span>
              <p className="text-slate-500 text-[11px] leading-snug">
                Grassroots civic foundations and industry CSR partners providing resources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Why report on CivicSolve Card */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-orange-600" />
          <span>{t('whyReport')}</span>
        </h3>

        <ul className="space-y-2.5 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">{t('point1Title')}</strong>
              <span className="text-slate-500 text-[11px]">{t('point1Desc')}</span>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">{t('point2Title')}</strong>
              <span className="text-slate-500 text-[11px]">{t('point2Desc')}</span>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-900">{t('point3Title')}</strong>
              <span className="text-slate-500 text-[11px]">{t('point3Desc')}</span>
            </div>
          </li>
        </ul>
      </div>

      {/* Trust & Data Transparency notice */}
      <div className="p-4 rounded-xl bg-blue-900 text-white space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-orange-300">
            Open Civic Governance
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          Reports are archived for public accountability. Your problem description is preserved in your native language ({currentLanguage.nativeName}) with normalized English handoff.
        </p>
      </div>

      {/* Emergency Helpline */}
      <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
        <span className="font-bold flex items-center gap-1.5 mb-1">
          <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
          <span>{t('helplineTitle')}</span>
        </span>
        <p className="text-amber-800 leading-snug">
          {t('helplineText')}
        </p>
      </div>
    </aside>
  );
};
