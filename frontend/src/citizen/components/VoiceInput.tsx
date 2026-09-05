import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Radio, 
  CheckCircle2,
  AlertCircle,
  Volume2,
  Globe
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface VoiceInputProps {
  currentDescription: string;
  onTranscriptUpdate: (text: string, mode: 'append' | 'replace') => void;
}

// Declaration for Web Speech API window properties
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  currentDescription,
  onTranscriptUpdate,
}) => {
  const { currentLanguage, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [listeningSeconds, setListeningSeconds] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);
  const hasTranscribedRef = useRef(false);

  useEffect(() => {
    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort error
        }
      }
    };
  }, []);

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startListening = () => {
    setNotice(null);
    setSuccessNotice(null);
    setInterimText('');
    hasTranscribedRef.current = false;

    const win = window as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
      setNotice(t('voiceUnsupported'));
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      // Configure speech recognition dynamically to listen in citizen's selected language
      recognition.lang = currentLanguage.speechCode || 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setListeningSeconds(0);
        timerRef.current = window.setInterval(() => {
          setListeningSeconds((prev) => {
            if (prev >= 180) {
              // auto-stop at 3 minutes to preserve battery and memory
              stopListening();
              return 180;
            }
            return prev + 1;
          });
        }, 1000);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptSegment = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcriptSegment;
          } else {
            interim += transcriptSegment;
          }
        }

        setInterimText(interim);

        if (final.trim().length > 0) {
          hasTranscribedRef.current = true;
          // Automatically append/place the resulting text into the existing description box
          onTranscriptUpdate(final.trim(), 'append');
          setInterimText('');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setNotice(t('voiceMicBlocked'));
        } else if (event.error === 'no-speech') {
          setNotice(t('voiceNoSpeech'));
        } else if (event.error === 'language-not-supported') {
          setNotice(`Voice input in ${currentLanguage.nativeName} (${currentLanguage.speechCode}) is not supported on this browser engine. Please type your text directly in the box above.`);
        } else {
          setNotice(`${t('voiceUnsupported')} (${event.error})`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (hasTranscribedRef.current) {
          setSuccessNotice(t('voiceSuccess'));
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setNotice(t('voiceMicBlocked'));
    }
  };

  const stopListening = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  return (
    <div className="space-y-3" id="voice-input-component">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-sm font-semibold text-slate-800">
            {t('voiceLabel')} <span className="text-xs font-normal text-slate-500">({t('voiceBadge')})</span>
          </label>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('voiceHint')}
          </p>
        </div>

        {/* Current Active Language for Speech */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-md text-xs font-medium text-blue-900 shrink-0">
          <Globe className="w-3.5 h-3.5 text-blue-700" />
          <span>{currentLanguage.nativeName}</span>
          <span className="font-mono text-[10px] text-blue-600 bg-blue-100/80 px-1 py-0.2 rounded">
            {currentLanguage.speechCode}
          </span>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        {/* Unsupported Browser Alert */}
        {!isSupported && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{t('voiceUnsupported')}</p>
              <p className="text-amber-800 mt-0.5">
                {t('descriptionHint')}
              </p>
            </div>
          </div>
        )}

        {/* State 1: Ready to Record */}
        {isSupported && !isListening && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-900/10 flex items-center justify-center text-blue-900 shrink-0 mt-0.5">
                <Mic className="w-5 h-5 text-blue-900" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span>{t('voiceRecordBtn')}</span>
                  <span className="text-xs font-bold text-blue-800">
                    ({currentLanguage.nativeName})
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                  {t('voiceHint')}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="start-voice-recording-btn"
              onClick={startListening}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 rounded-lg shadow-2xs transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <Mic className="w-4 h-4 text-orange-400" />
              <span>{t('voiceRecordBtn')}</span>
            </button>
          </div>
        )}

        {/* State 2: Actively Listening */}
        {isListening && (
          <div className="space-y-3" id="voice-recording-active">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-50/80 border border-red-200 p-3.5 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-75" />
                  <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white relative shadow-xs">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {t('voiceListening')}
                    </span>
                    <span className="font-mono text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200">
                      {formatSeconds(listeningSeconds)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      ({currentLanguage.nativeName} • {currentLanguage.speechCode})
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t('voiceHint')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="stop-voice-recording-btn"
                  onClick={stopListening}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{t('voiceStopBtn')}</span>
                </button>
              </div>
            </div>

            {/* Live interim preview while speaking */}
            {interimText && (
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono italic">
                <span className="text-slate-400 mr-1.5 not-italic font-sans font-semibold">
                  {t('voiceCapturing')}:
                </span>
                "{interimText}..."
              </div>
            )}
          </div>
        )}

        {/* Success / Feedback notice */}
        {successNotice && !isListening && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline"
            >
              {t('voiceDismiss')}
            </button>
          </div>
        )}

        {/* Notice (Permission error or no-speech) */}
        {notice && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-amber-700 hover:text-amber-900 text-xs font-bold underline shrink-0"
            >
              {t('voiceDismiss')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
