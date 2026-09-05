export interface TranslationResult {
  success: boolean;
  originalText: string;
  sourceLanguage: string;
  englishText: string;
  service?: string;
  notes?: string;
  error?: string;
}

/**
 * Citizen-Facing Translation Service Client
 *
 * Clean boundary function: translateToEnglish(originalText, sourceLanguage)
 *
 * - Sends text to the backend translation service adapter (/api/citizen/translate)
 * - If sourceLanguage is 'en', immediately returns the original text without network overhead.
 * - Handles errors gracefully without breaking the user experience.
 * - Guarantees the original language text is NEVER destroyed or replaced.
 */
export async function translateToEnglish(
  originalText: string,
  sourceLanguage: string
): Promise<TranslationResult> {
  const trimmed = originalText.trim();
  if (!trimmed) {
    return {
      success: true,
      originalText,
      sourceLanguage,
      englishText: '',
      service: 'passthrough_en',
    };
  }

  // Pass-through if already English
  if (sourceLanguage.toLowerCase() === 'en') {
    return {
      success: true,
      originalText: trimmed,
      sourceLanguage: 'en',
      englishText: trimmed,
      service: 'passthrough_en',
    };
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/citizen/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: trimmed,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        originalText: trimmed,
        sourceLanguage,
        englishText: trimmed,
        service: 'fallback_pending',
        error: errorData.message || 'Translation service returned an error status.',
      };
    }

    const data = await response.json();
    return {
      success: data.success,
      originalText: trimmed,
      sourceLanguage,
      englishText: data.englishText || trimmed,
      service: data.service,
      notes: data.notes,
      error: data.error,
    };
  } catch (error: any) {
    console.warn('[translateToEnglish] Network/client error:', error);
    return {
      success: false,
      originalText: trimmed,
      sourceLanguage,
      englishText: trimmed,
      service: 'fallback_pending',
      error: error?.message || 'Could not connect to translation service.',
    };
  }
}
