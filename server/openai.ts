import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

// Initialize OpenAI client with fallback to environment variable or user-provided key
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || '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';
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (err) {
    console.error('[OpenAI] Error initializing OpenAI client:', err);
    return null;
  }
}

/**
 * Fallback to Google Gemini AI engine when OpenAI quota or key fails
 */
async function queryGeminiFallback(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API key is not configured.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          { role: 'user', parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.5
        }
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err) {
      lastErr = err;
      console.warn(`[Gemini Fallback] Model ${modelName} failed, trying next fallback model...`);
    }
  }

  throw lastErr || new Error('Gemini AI service failed to generate content.');
}

/**
 * Helper to call OpenAI API with system instructions and user prompt, falling back to Gemini if OpenAI hits 429 quota limits or fails
 */
export async function queryOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const openai = getOpenAIClient();
  let openAiErrorMsg: string | null = null;
  
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1500
      });

      const content = response.choices[0]?.message?.content;
      if (content && content.trim().length > 0) {
        return content.trim();
      }
    } catch (err: any) {
      openAiErrorMsg = err?.message || String(err);
      console.warn(`[OpenAI] Primary API call failed (${openAiErrorMsg}). Switching to Google Gemini AI fallback...`);
    }
  } else {
    openAiErrorMsg = 'OpenAI API key is missing or not configured.';
    console.warn('[OpenAI] OpenAI client unavailable. Switching to Google Gemini AI fallback...');
  }

  // Attempt Google Gemini fallback
  try {
    const fallbackResult = await queryGeminiFallback(systemPrompt, userPrompt);
    return fallbackResult;
  } catch (geminiErr: any) {
    const geminiErrorMsg = geminiErr?.message || String(geminiErr);
    console.error('[AI Engine] Both OpenAI and Gemini Fallback failed:', { openAiErrorMsg, geminiErrorMsg });

    if (openAiErrorMsg && (openAiErrorMsg.includes('quota') || openAiErrorMsg.includes('429'))) {
      throw new Error(`OpenAI API Key Quota Exceeded (Error 429). The provided OpenAI API key has run out of usage credits. Please top up your OpenAI balance or set GEMINI_API_KEY in .env.`);
    }

    if (openAiErrorMsg) {
      throw new Error(`OpenAI Error: ${openAiErrorMsg}`);
    }

    throw new Error('AI engine is currently busy or unavailable. Please check your API keys.');
  }
}

/**
 * Helper to fetch live weather JSON data for a city
 */
export async function fetchLiveWeatherData(city: string): Promise<any> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    console.warn('[Weather API] wttr.in fetch failed or timed out:', e);
  }
  return null;
}

/**
 * Helper to fetch live news headlines from Google News RSS feed
 */
export async function fetchLiveNewsData(topic: string): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);
    if (res.ok) {
      const xml = await res.text();
      const items: string[] = [];
      const itemRegex = /<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<source[^>]*>(.*?)<\/source>/gi;
      let match;
      let count = 0;
      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const title = match[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&');
        const pubDate = match[2];
        const source = match[3].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1');
        items.push(`Title: ${title}\nSource: ${source}\nDate: ${pubDate}`);
        count++;
      }
      return items;
    }
  } catch (e) {
    console.warn('[News API] RSS fetch failed or timed out:', e);
  }
  return [];
}
