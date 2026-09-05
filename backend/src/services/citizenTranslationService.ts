export interface TranslationResponse {
  success: boolean;
  originalText: string;
  sourceLanguage: string;
  englishText: string;
  service: "gemini" | "mymemory" | "passthrough_en" | "fallback_pending";
  notes?: string;
  error?: string;
}

class TranslationService {
  async translateToEnglish(text: string, sourceLanguage: string): Promise<TranslationResponse> {
    const trimmed = text.trim();

    if (!trimmed || sourceLanguage.toLowerCase() === "en") {
      return {
        success: true,
        originalText: text,
        sourceLanguage: sourceLanguage.toLowerCase() === "en" ? "en" : sourceLanguage,
        englishText: trimmed,
        service: "passthrough_en",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const endpoint =
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Translate the following civic problem report from ${sourceLanguage} to clear standard English. Do not summarize, analyze, or add information. Return only the translation.\n\n${trimmed}`,
                  },
                ],
              },
            ],
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const translated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (translated) {
            return {
              success: true,
              originalText: text,
              sourceLanguage,
              englishText: translated,
              service: "gemini",
            };
          }
        }
      } catch (error) {
        console.warn("[TranslationService] Gemini translation failed:", error);
      }
    }

    try {
      const encodedText = encodeURIComponent(trimmed.slice(0, 500));
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${encodeURIComponent(sourceLanguage)}|en`;
      const response = await fetch(url, {
        headers: { "User-Agent": "CivicSolve/1.0" },
      });

      if (response.ok) {
        const data: any = await response.json();
        const translated = data?.responseData?.translatedText?.trim();
        if (translated && translated !== trimmed && !translated.toUpperCase().includes("MYMEMORY WARNING")) {
          return {
            success: true,
            originalText: text,
            sourceLanguage,
            englishText: translated,
            service: "mymemory",
          };
        }
      }
    } catch (error) {
      console.warn("[TranslationService] MyMemory translation failed:", error);
    }

    return {
      success: false,
      originalText: text,
      sourceLanguage,
      englishText: trimmed,
      service: "fallback_pending",
      notes: "Translation service is unavailable. Original text was preserved.",
      error: "English translation could not be completed automatically.",
    };
  }
}

export const translationService = new TranslationService();
