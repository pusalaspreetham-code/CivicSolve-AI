export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  script: string;
  speechCode: string; // BCP 47 language tag for Web Speech API
  direction?: 'ltr' | 'rtl';
  isConstitutionallyScheduled?: boolean;
}

export type TranslationKey =
  // Header & Brand
  | 'appName'
  | 'pilotBadge'
  | 'appTagline'
  | 'networkBanner'
  | 'verifiedIntake'
  | 'reportProblemBtn'
  | 'howItWorks'
  | 'stakeholders'
  | 'faq'
  | 'selectLanguage'
  | 'language'
  
  // Hero & Intro
  | 'citizenIntakeBadge'
  | 'civicRegistry'
  | 'heroTitle'
  | 'heroSubtitle'
  | 'connectedPartners'
  | 'partnerGov'
  | 'partnerUnis'
  | 'partnerNgos'
  
  // Form Card
  | 'formTitle'
  | 'formSubtitle'
  | 'publicRegistry'
  | 'requiredFieldsNotice'
  | 'fillSample'
  
  // Problem Description
  | 'descriptionLabel'
  | 'descriptionHint'
  | 'descriptionPlaceholder'
  | 'descriptionRequiredError'
  | 'descriptionMinLengthError'
  
  // Voice Input
  | 'voiceLabel'
  | 'voiceBadge'
  | 'voiceHint'
  | 'voiceRecordBtn'
  | 'voiceListening'
  | 'voiceStopBtn'
  | 'voiceSuccess'
  | 'voiceMicBlocked'
  | 'voiceNoSpeech'
  | 'voiceUnsupported'
  | 'voiceLangNotice'
  | 'voiceCapturing'
  | 'voiceDismiss'
  
  // Location Input
  | 'locationLabel'
  | 'locationHint'
  | 'locationPlaceholder'
  | 'useCurrentLocationBtn'
  | 'gettingLocation'
  | 'locationDetected'
  | 'locationDenied'
  | 'locationRequiredError'
  | 'gpsCoordinates'
  | 'accuracy'
  
  // Evidence Uploader
  | 'evidenceLabel'
  | 'evidenceOptional'
  | 'evidenceHint'
  | 'dragDropText'
  | 'browseFiles'
  | 'takePhoto'
  | 'maxFilesNotice'
  | 'fileAttached'
  | 'filesAttached'
  | 'removeFile'
  
  // Preview Screen
  | 'previewTitle'
  | 'previewSubtitle'
  | 'selectedLangLabel'
  | 'originalDescriptionLabel'
  | 'englishTranslationLabel'
  | 'translatingNotice'
  | 'translationSuccess'
  | 'translationFailedNotice'
  | 'locationSummaryLabel'
  | 'evidenceSummaryLabel'
  | 'noEvidenceAttached'
  | 'editProblemBtn'
  | 'confirmSubmitBtn'
  | 'reviewAndPreviewBtn'
  | 'submittingBtn'
  | 'aiHandoffNotice'
  
  // Submission Success
  | 'successBadge'
  | 'successTitle'
  | 'successSubtitle'
  | 'trackingRefLabel'
  | 'copyIdBtn'
  | 'copiedBtn'
  | 'intakeOverview'
  | 'statusReceived'
  | 'reportAnotherBtn'
  | 'printReceiptBtn'
  | 'nextStepsTitle'
  | 'step1Title'
  | 'step1Desc'
  | 'step2Title'
  | 'step2Desc'
  | 'step3Title'
  | 'step3Desc'
  | 'developerInspector'
  
  // Sidebar & Info
  | 'sidebarTitle'
  | 'sidebarDesc'
  | 'whyReport'
  | 'point1Title'
  | 'point1Desc'
  | 'point2Title'
  | 'point2Desc'
  | 'point3Title'
  | 'point3Desc'
  | 'helplineTitle'
  | 'helplineText'
  
  // Errors & General
  | 'errorTitle'
  | 'errorDismiss';

export type TranslationDictionary = Record<TranslationKey, string>;
