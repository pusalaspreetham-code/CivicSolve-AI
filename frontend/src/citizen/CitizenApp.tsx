import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { ProblemForm } from './components/ProblemForm';
import { SubmissionSuccess } from './components/SubmissionSuccess';
import { CivicInfoSidebar } from './components/CivicInfoSidebar';
import { Footer } from './components/Footer';
import { ProblemIntakeReceipt } from './types';
import { useLanguage } from './context/LanguageContext';
import {
  Building2,
  Users2,
  GraduationCap,
  FileEdit,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [submittedData, setSubmittedData] = useState<ProblemIntakeReceipt | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const handleScrollToForm = () => {
    if (submittedData) {
      setSubmittedData(null);
    }

    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleSuccess = (receipt: ProblemIntakeReceipt) => {
    setSubmittedData(receipt);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleReset = () => {
    setSubmittedData(null);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-900 selection:text-white">

      {/* 1. Header with integrated multilingual selector */}
      <Header onReportClick={handleScrollToForm} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">

        {/* 2. Main Section Intro */}
        <section
          className="space-y-4"
          id="intro-section"
          ref={formSectionRef}
        >

          {/* Breadcrumb / Institutional indicator */}
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-orange-500" />

            <span>Citizen Public Intake Module</span>

            <span className="text-slate-300">/</span>

            <span className="text-slate-600 font-normal">
              Civic Problem Registry
            </span>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {t('heroTitle')}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Institutional Stakeholders Ribbon */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-600">

            <span className="font-semibold text-slate-800">
              {t('connectedPartners')}:
            </span>

            {/* Government */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-blue-900" />
              {t('partnerGov')}
            </span>

            {/* Universities & Students */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs font-medium text-slate-700">
              <GraduationCap className="w-3.5 h-3.5 text-orange-600" />
              {t('partnerUnis')}
            </span>

            {/* Industry */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-md shadow-2xs font-medium text-slate-700">
              <Users2 className="w-3.5 h-3.5 text-emerald-700" />
              Industry
            </span>

          </div>
        </section>

        {/* 3. Main Content: Form / Success view + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Form or Success column */}
          <div className="lg:col-span-8">
            {submittedData ? (
              <SubmissionSuccess
                payload={submittedData}
                onReset={handleReset}
              />
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">

                <div className="pb-6 border-b border-slate-100 flex items-center justify-between">

                  <div className="flex items-center gap-2.5">

                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-900">
                      <FileEdit className="w-5 h-5" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-slate-900">
                        {t('formTitle')}
                      </h2>

                      <p className="text-xs text-slate-500">
                        {t('formSubtitle')}
                      </p>
                    </div>

                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Public Civic Registry</span>
                  </div>

                </div>

                <div className="pt-6">
                  <ProblemForm onSuccess={handleSuccess} />
                </div>

              </div>
            )}
          </div>

          {/* Context Sidebar */}
          <div className="lg:col-span-4">
            <CivicInfoSidebar />
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
}