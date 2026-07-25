import { Command, CommandContext } from './commands';
import { queryOpenAI, fetchLiveWeatherData, fetchLiveNewsData } from './openai';

/**
 * Format standard OpenAI response card
 */
function formatAiResponse(cmdName: string, query: string, aiAnswer: string, durationSeconds: string): string {
  return `🤖 *Command:* .${cmdName}
📌 *Query:* ${query}

${aiAnswer.trim()}

⏰ *Response Time:* ${durationSeconds}s
⚡ *Powered by OpenAI*`;
}

/**
 * Shared wrapper for handling OpenAI commands with timing, input validation, and formatting
 */
async function handleOpenAiCommand(
  ctx: CommandContext,
  cmdName: string,
  usageHelp: string,
  systemPrompt: string,
  buildUserPrompt: (input: string) => Promise<string> | string
) {
  const { sock, chatJid, msg, args } = ctx;
  const input = args.join(' ').trim();

  if (!input) {
    await sock.sendMessage(chatJid, {
      text: `⚠️ *Missing Input!*\n\n*Usage:* \`.${cmdName} ${usageHelp}\`\n*Example:* \`.${cmdName} ${usageHelp.replace(/<[^>]+>/g, 'example')}\``
    }, { quoted: msg });
    return;
  }

  const startTime = Date.now();

  // Send an initial processing notice or status indicator
  try {
    await sock.sendMessage(chatJid, {
      react: { text: '🔍', key: msg.key }
    });
  } catch (e) {}

  try {
    const userPrompt = await buildUserPrompt(input);
    const aiResult = await queryOpenAI(systemPrompt, userPrompt);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const formattedResponse = formatAiResponse(cmdName, input, aiResult, duration);

    try {
      await sock.sendMessage(chatJid, { react: { text: '✅', key: msg.key } });
    } catch (e) {}

    await sock.sendMessage(chatJid, { text: formattedResponse }, { quoted: msg });
  } catch (err: any) {
    console.error(`[OpenAI Command .${cmdName} Error]:`, err);
    try {
      await sock.sendMessage(chatJid, { react: { text: '❌', key: msg.key } });
    } catch (e) {}

    await sock.sendMessage(chatJid, {
      text: `❌ *OpenAI Error:* Failed to process query for \`.${cmdName}\`.\n\n*Reason:* ${err?.message || 'Service unavailable. Please try again later.'}`
    }, { quoted: msg });
  }
}

// ==========================================
// 1. .meaning
// ==========================================
export const meaningCmd: Command = {
  name: 'meaning',
  aliases: ['def', 'define'],
  category: 'SEARCH',
  description: 'Get comprehensive dictionary word meaning and etymology',
  usage: '.meaning <word>',
  handler: async (ctx) => {
    const systemPrompt = `You are a world-class dictionary and linguistics expert.
Provide a clear, detailed breakdown for the requested word.
You MUST format your response using EXACTLY these headings:

📖 *Definition:*
<detailed definition>

📝 *Simple Explanation:*
<easy to understand explanation>

🌍 *Origin (Etymology):*
<historical origin of the word>

🗣 *Pronunciation:*
<phonetic spelling e.g. /ɪn.əˈveɪ.ʃən/>

📚 *Part of Speech:*
<noun, verb, adjective, etc.>

📌 *Example Sentence:*
<a clear example sentence>

🔄 *Synonyms:*
<3-5 synonyms separated by commas>

🚫 *Antonyms:*
<3-5 antonyms separated by commas>`;

    await handleOpenAiCommand(
      ctx,
      'meaning',
      '<word>',
      systemPrompt,
      (word) => `Provide the complete word meaning and linguistic breakdown for: "${word}"`
    );
  }
};

// ==========================================
// 2. .explain
// ==========================================
export const explainCmd: Command = {
  name: 'explain',
  aliases: ['concept', 'whatis'],
  category: 'SEARCH',
  description: 'Explain any concept or topic in simple language with examples',
  usage: '.explain <topic>',
  handler: async (ctx) => {
    const systemPrompt = `You are an expert educator and communicator. Explain the given topic clearly in simple, engaging language.
You MUST format your output with these sections:

📖 *Definition:*
<clear high-level definition>

💡 *Key Points:*
• <point 1>
• <point 2>
• <point 3>

🌍 *Real-life Examples:*
• <example 1>
• <example 2>

✅ *Advantages:*
• <advantage 1>
• <advantage 2>

❌ *Disadvantages:*
• <disadvantage 1>
• <disadvantage 2>

✨ *Interesting Facts:*
• <fact 1>
• <fact 2>`;

    await handleOpenAiCommand(
      ctx,
      'explain',
      '<topic>',
      systemPrompt,
      (topic) => `Explain the topic: "${topic}"`
    );
  }
};

// ==========================================
// 3. .history
// ==========================================
export const historyCmd: Command = {
  name: 'history',
  aliases: ['hist', 'historical'],
  category: 'SEARCH',
  description: 'Get detailed historical timeline and background of any topic, place, or event',
  usage: '.history <topic>',
  handler: async (ctx) => {
    const systemPrompt = `You are a renowned historian. Provide a concise, accurate historical breakdown.
You MUST format your response with these sections:

🏛️ *Historical Background:*
<brief introduction and origin>

⏳ *Key Timeline:*
• <Year/Period>: <Event description>
• <Year/Period>: <Event description>
• <Year/Period>: <Event description>

🔥 *Important Events:*
• <event 1>
• <event 2>

👑 *Key People:*
• <person 1 and role>
• <person 2 and role>

⭐ *Historical Significance:*
<why this matters in world/local history>

📝 *Summary:*
<a concise wrap-up paragraph>`;

    await handleOpenAiCommand(
      ctx,
      'history',
      '<topic>',
      systemPrompt,
      (topic) => `Provide historical timeline and detailed background for: "${topic}"`
    );
  }
};

// ==========================================
// 4. .country
// ==========================================
export const countryCmd: Command = {
  name: 'country',
  aliases: ['countryinfo', 'nation'],
  category: 'SEARCH',
  description: 'Get key facts, statistics, and overview of any country',
  usage: '.country <country name>',
  handler: async (ctx) => {
    const systemPrompt = `You are a geography and international relations expert.
Provide comprehensive facts for the requested country.
You MUST format your response with these sections:

🏛️ *Capital:* <capital name>
👥 *Population:* <estimated population>
💵 *Currency:* <currency name & symbol>
🗣️ *Official Languages:* <languages>
📐 *Area:* <area in sq km / sq miles>
🏛️ *Government Type:* <government system>
🌍 *Continent:* <continent name>
🚩 *National Flag / Symbol:* <flag emoji and national emblem/symbol>

📝 *Short Description:*
<a rich 2-3 sentence overview of the country, its culture, and key characteristics>`;

    await handleOpenAiCommand(
      ctx,
      'country',
      '<country name>',
      systemPrompt,
      (country) => `Provide detailed country profile for: "${country}"`
    );
  }
};

// ==========================================
// 5. .city
// ==========================================
export const cityCmd: Command = {
  name: 'city',
  aliases: ['cityinfo', 'town'],
  category: 'SEARCH',
  description: 'Get information, famous landmarks, and history of any city',
  usage: '.city <city name>',
  handler: async (ctx) => {
    const systemPrompt = `You are a travel and geography expert.
Provide facts and attractions for the requested city.
You MUST format your response with these sections:

🌍 *Country:* <country name>
👥 *Population:* <estimated population if known>

🏛️ *Famous Landmarks:*
• <landmark 1>
• <landmark 2>
• <landmark 3>

🗼 *Tourist Attractions:*
• <attraction 1>
• <attraction 2>

📜 *Short History:*
<concise historical overview of the city>

✨ *Interesting Facts:*
• <fact 1>
• <fact 2>`;

    await handleOpenAiCommand(
      ctx,
      'city',
      '<city name>',
      systemPrompt,
      (city) => `Provide city facts and landmarks for: "${city}"`
    );
  }
};

// ==========================================
// 6. .weather
// ==========================================
export const weatherCmd: Command = {
  name: 'weather',
  aliases: ['climate', 'forecast'],
  category: 'SEARCH',
  description: 'Get live weather conditions and forecast for any city',
  usage: '.weather <city>',
  handler: async (ctx) => {
    const systemPrompt = `You are a professional weather anchor and meteorologist.
You will be provided with live weather telemetry data (or a city name if offline).
Format the weather report nicely with exact metrics and emoji indicators:

🌡 *Current Temperature:* <temp in °C and °F> (Feels like <feelslike>)
☁ *Weather Condition:* <condition e.g., Clear, Sunny, Light Rain>
💧 *Humidity:* <humidity %>
💨 *Wind Speed:* <wind speed in km/h or mph>
👁 *Visibility:* <visibility in km>
🌅 *Sunrise:* <sunrise time>
🌇 *Sunset:* <sunset time>
🌧 *Chance of Rain:* <chance %>

📅 *Forecast:*
• *Today:* <brief summary>
• *Tomorrow:* <brief summary>`;

    await handleOpenAiCommand(
      ctx,
      'weather',
      '<city>',
      systemPrompt,
      async (city) => {
        const liveData = await fetchLiveWeatherData(city);
        if (liveData && liveData.current_condition && liveData.current_condition[0]) {
          const curr = liveData.current_condition[0];
          const weatherObj = liveData.weather ? liveData.weather[0] : null;
          const astronomy = weatherObj?.astronomy ? weatherObj.astronomy[0] : null;

          return `City: ${city}
Live Weather Data:
- Temp: ${curr.temp_C}°C (${curr.temp_F}°F), Feels like: ${curr.FeelsLikeC}°C (${curr.FeelsLikeF}°F)
- Condition: ${curr.weatherDesc ? curr.weatherDesc[0].value : 'N/A'}
- Humidity: ${curr.humidity}%
- Wind: ${curr.windspeedKmph} km/h (${curr.winddir16Point})
- Visibility: ${curr.visibility} km
- Sunrise: ${astronomy?.sunrise || 'N/A'}
- Sunset: ${astronomy?.sunset || 'N/A'}
- Chance of Rain: ${weatherObj?.hourly?.[0]?.chanceofrain || '0'}%
Please format this into the official weather template.`;
        }
        return `City: ${city}. Please generate a realistic, standard meteorological weather estimate and forecast for this location.`;
      }
    );
  }
};

// ==========================================
// 7. .news
// ==========================================
export const newsCmd: Command = {
  name: 'news',
  aliases: ['headlines', 'breakingnews'],
  category: 'SEARCH',
  description: 'Get latest news headlines and summaries on any topic or region',
  usage: '.news <topic>',
  handler: async (ctx) => {
    const systemPrompt = `You are an international news editor.
Format the provided headlines and news articles into clean, scannable news summaries.

📰 *LATEST HEADLINES & SUMMARIES*

• 📌 *Headline 1:* <headline>
  📝 *Summary:* <short summary>
  📅 *Date:* <publication date>
  🏢 *Source:* <news source name>

• 📌 *Headline 2:* <headline>
  📝 *Summary:* <short summary>
  📅 *Date:* <publication date>
  🏢 *Source:* <news source name>

• 📌 *Headline 3:* <headline>
  📝 *Summary:* <short summary>
  📅 *Date:* <publication date>
  🏢 *Source:* <news source name>`;

    await handleOpenAiCommand(
      ctx,
      'news',
      '<topic>',
      systemPrompt,
      async (topic) => {
        const headlines = await fetchLiveNewsData(topic);
        if (headlines.length > 0) {
          return `Topic requested: "${topic}"
Recent Articles Fetched:
${headlines.join('\n---\n')}

Please summarize these into the requested news format.`;
        }
        return `Topic requested: "${topic}". Please provide a current news summary and analysis covering recent developments regarding this topic.`;
      }
    );
  }
};

// ==========================================
// 8. .ask
// ==========================================
export const askCmd: Command = {
  name: 'ask',
  aliases: ['query', 'question', 'gpt'],
  category: 'SEARCH',
  description: 'Ask any general knowledge or complex question to OpenAI',
  usage: '.ask <question>',
  handler: async (ctx) => {
    const systemPrompt = `You are an intelligent AI knowledge assistant powered by OpenAI.
Provide an accurate, clear, and comprehensive answer to the user's question.
Structure your response cleanly with:
• A direct, clear answer
• Bulleted key explanations
• Real-world examples or applications where helpful`;

    await handleOpenAiCommand(
      ctx,
      'ask',
      '<question>',
      systemPrompt,
      (q) => `Question: "${q}"`
    );
  }
};

// ==========================================
// 9. .synonym
// ==========================================
export const synonymCmd: Command = {
  name: 'synonym',
  aliases: ['synonyms', 'similarwords'],
  category: 'SEARCH',
  description: 'Find synonyms and similar vocabulary for any word',
  usage: '.synonym <word>',
  handler: async (ctx) => {
    const systemPrompt = `You are a vocabulary specialist.
Provide a rich list of synonyms, similar words, and practical usage examples for the word requested.

🔄 *Direct Synonyms:*
• <synonym 1>
• <synonym 2>
• <synonym 3>
• <synonym 4>

🔤 *Related / Similar Words:*
• <word 1>, <word 2>, <word 3>

📝 *Usage Examples:*
• <Example sentence using synonym 1>
• <Example sentence using synonym 2>`;

    await handleOpenAiCommand(
      ctx,
      'synonym',
      '<word>',
      systemPrompt,
      (word) => `Provide synonyms and similar words for: "${word}"`
    );
  }
};

// ==========================================
// 10. .antonym
// ==========================================
export const antonymCmd: Command = {
  name: 'antonym',
  aliases: ['antonyms', 'opposite'],
  category: 'SEARCH',
  description: 'Find antonyms and opposite words for any term',
  usage: '.antonym <word>',
  handler: async (ctx) => {
    const systemPrompt = `You are a vocabulary specialist.
Provide direct antonyms and contrasting usage examples for the requested word.

🚫 *Direct Antonyms:*
• <antonym 1>
• <antonym 2>
• <antonym 3>
• <antonym 4>

📝 *Example Sentences (Contrasting Use):*
• <Sentence highlighting the opposite meaning>
• <Sentence highlighting the opposite meaning>`;

    await handleOpenAiCommand(
      ctx,
      'antonym',
      '<word>',
      systemPrompt,
      (word) => `Provide antonyms and opposite terms for: "${word}"`
    );
  }
};

// ==========================================
// 11. .grammar
// ==========================================
export const grammarCmd: Command = {
  name: 'grammar',
  aliases: ['checkgrammar', 'proofread', 'correct'],
  category: 'SEARCH',
  description: 'Check grammar, correct errors, and suggest improved phrasing',
  usage: '.grammar <sentence>',
  handler: async (ctx) => {
    const systemPrompt = `You are a expert proofreader and English grammar professor.
Analyze the provided text and output:

✏️ *Corrected Version:*
"<corrected text>"

💡 *Explanation of Corrections:*
• <correction 1 and rule explanation>
• <correction 2 and rule explanation>

✨ *Polished / Professional Alternative:*
"<an even higher quality, professional rewrite>"`;

    await handleOpenAiCommand(
      ctx,
      'grammar',
      '<sentence>',
      systemPrompt,
      (text) => `Check and fix grammar for: "${text}"`
    );
  }
};

// ==========================================
// 12. .translate
// ==========================================
export const translateCmd: Command = {
  name: 'translate',
  aliases: ['tr', 'translator'],
  category: 'SEARCH',
  description: 'Translate text into any language with transliteration',
  usage: '.translate <target_language> <text>',
  handler: async (ctx) => {
    const { args, sock, chatJid, msg } = ctx;
    if (args.length < 2) {
      await sock.sendMessage(chatJid, {
        text: `⚠️ *Missing Parameters!*\n\n*Usage:* \`.translate <target_language> <text>\`\n*Example:* \`.translate Urdu Hello, how are you?\`\n*Example:* \`.translate Arabic Good morning my friend\``
      }, { quoted: msg });
      return;
    }

    const targetLang = args[0];
    const textToTranslate = args.slice(1).join(' ');

    const systemPrompt = `You are a multilingual translator expert.
Translate the text into the requested target language.
Format your output as:

🌐 *Target Language:* ${targetLang}

🔤 *Original Text:*
"${textToTranslate}"

📝 *Translation:*
"<translated text>"

🗣 *Transliteration / Pronunciation (if applicable):*
"<phonetic pronunciation in Latin script>"`;

    await handleOpenAiCommand(
      ctx,
      'translate',
      '<language> <text>',
      systemPrompt,
      () => `Translate into ${targetLang}: "${textToTranslate}"`
    );
  }
};

// ==========================================
// 13. .fact
// ==========================================
export const factCmd: Command = {
  name: 'fact',
  aliases: ['facts', 'trivia'],
  category: 'SEARCH',
  description: 'Get fascinating educational facts and trivia on any topic',
  usage: '.fact <topic>',
  handler: async (ctx) => {
    const systemPrompt = `You are a science and general knowledge trivia expert.
Provide fascinating, verified facts about the requested topic.

💡 *Fascinating Facts:*
• <Fact 1>
• <Fact 2>
• <Fact 3>

🎓 *Educational Context:*
<1-2 sentences explaining why these facts are scientifically or historically significant>

🎉 *Fun Trivia:*
• <Surprising or rare trivia fact>`;

    await handleOpenAiCommand(
      ctx,
      'fact',
      '<topic>',
      systemPrompt,
      (topic) => `Provide interesting facts and trivia about: "${topic}"`
    );
  }
};

// ==========================================
// 14. .dictionary
// ==========================================
export const dictionaryCmd: Command = {
  name: 'dictionary',
  aliases: ['dict', 'lexicon'],
  category: 'SEARCH',
  description: 'Complete dictionary breakdown including pronunciation, origin, synonyms, and antonyms',
  usage: '.dictionary <word>',
  handler: async (ctx) => {
    const systemPrompt = `You are an exhaustive dictionary lexicon engine.
Provide a complete dictionary breakdown.

📖 *Meaning:*
<definition>

🗣 *Pronunciation:*
<IPA phonetic spelling>

📚 *Part of Speech:*
<noun / verb / adjective / etc.>

🌍 *Word Origin:*
<etymology>

📌 *Example Sentences:*
• <sentence 1>
• <sentence 2>

🔄 *Synonyms:* <synonyms>
🚫 *Antonyms:* <antonyms>`;

    await handleOpenAiCommand(
      ctx,
      'dictionary',
      '<word>',
      systemPrompt,
      (word) => `Provide full dictionary details for: "${word}"`
    );
  }
};

// ==========================================
// 15. .math
// ==========================================
export const mathCmd: Command = {
  name: 'math',
  aliases: ['solve', 'calculate', 'algebra'],
  category: 'SEARCH',
  description: 'Solve mathematical equations, algebra, calculus, or word problems step-by-step',
  usage: '.math <problem>',
  handler: async (ctx) => {
    const systemPrompt = `You are an expert mathematics professor.
Solve the mathematical problem with clear, step-by-step logical breakdown.

🔢 *Problem:*
<stated problem>

📝 *Step-by-Step Solution:*
Step 1: <explanation & calculation>
Step 2: <explanation & calculation>
Step 3: <explanation & calculation>

✅ *Final Answer:*
<boxed/highlighted final numerical or algebraic answer>`;

    await handleOpenAiCommand(
      ctx,
      'math',
      '<problem>',
      systemPrompt,
      (problem) => `Solve step-by-step: "${problem}"`
    );
  }
};

// Export list of all OpenAI commands
export const openAiCommands: Command[] = [
  meaningCmd,
  explainCmd,
  historyCmd,
  countryCmd,
  cityCmd,
  weatherCmd,
  newsCmd,
  askCmd,
  synonymCmd,
  antonymCmd,
  grammarCmd,
  translateCmd,
  factCmd,
  dictionaryCmd,
  mathCmd
];
