/**
 * Islamic Commands Module for Hijjaze WhatsApp Bot
 * Provides professional, authentic Islamic commands with full multi-language support (Arabic, English, Urdu)
 */

import { Command } from './commands';
import {
  SURAH_LIST,
  ALLAH_NAMES_99,
  DUA_DATABASE,
  ZIKR_DATABASE,
  HADITH_DATABASE,
  HadithItem,
  DuaItem,
  ZikrItem,
  AllahName
} from './islamic_data';
import {
  formatIslamicBox,
  fetchQuranAyah,
  findSurahMeta,
  fetchPrayerTimes,
  fetchQiblaDirection,
  fetchTafsirDetails
} from './islamic_service';

export const islamicCommands: Command[] = [
  // 1. .quran
  {
    name: 'quran',
    aliases: ['tilawat', 'koran', 'verse'],
    category: '🕌 ISLAMIC',
    description: 'Fetch authentic Quranic verse by Surah name, number, or ayah (or random)',
    usage: '.quran [Surah | Surah:Ayah | Number]',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim();

      // Show processing reaction
      try {
        await sock.sendMessage(chatJid, { react: { text: '📖', key: msg.key } });
      } catch (e) {}

      try {
        let spec = input;
        if (!spec) {
          // Select a random popular Ayah if no spec given
          const randomSurahs = ['1:1', '2:255', '36:58', '55:13', '67:1', '112:1', '113:1', '114:1'];
          spec = randomSurahs[Math.floor(Math.random() * randomSurahs.length)];
        }

        const data = await fetchQuranAyah(spec);

        const explanationText = `• Surah: ${data.surahName} (${data.surahNumber})
• Ayah Number: ${data.ayahNumber}
• Juz (Para): ${data.juzNumber || '1'}
• Audio Recitation (Mishary Alafasy):
${data.audioUrl || 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3'}`;

        const responseText = formatIslamicBox({
          command: `quran ${spec}`,
          arabic: data.arabic,
          transliteration: data.transliteration,
          english: data.english,
          urdu: data.urdu,
          explanation: explanationText,
          source: data.source
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err: any) {
        console.error('[.quran Command Error]:', err);
        const errorMsg = formatIslamicBox({
          command: 'quran',
          explanation: `⚠️ Failed to fetch Quran verse.\n\nUsage examples:\n• .quran (random verse)\n• .quran 1 (Surah Al-Fatihah)\n• .quran 2:255 (Ayatul Kursi)\n• .quran Al-Kahf`,
          source: 'System Error Boundary'
        });
        await sock.sendMessage(chatJid, { text: errorMsg }, { quoted: msg });
      }
    }
  },

  // 2. .surah
  {
    name: 'surah',
    aliases: ['surainfo', 'chapter'],
    category: '🕌 ISLAMIC',
    description: 'Get comprehensive information and summary of any Quranic Surah',
    usage: '.surah <Surah Name or Number>',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim();

      if (!input) {
        const usageText = formatIslamicBox({
          command: 'surah',
          explanation: `⚠️ Missing Surah specification.\n\nUsage:\n• .surah Al-Kahf\n• .surah 18\n• .surah Yaseen\n• .surah 2`,
          source: 'Hijjaze Islamic Center'
        });
        await sock.sendMessage(chatJid, { text: usageText }, { quoted: msg });
        return;
      }

      try {
        const meta = findSurahMeta(input);
        if (!meta) {
          const notFoundText = formatIslamicBox({
            command: `surah ${input}`,
            explanation: `❌ Surah "${input}" not found.\n\nPlease check the spelling or provide a valid Surah number between 1 and 114.`,
            source: 'Hijjaze Islamic Center'
          });
          await sock.sendMessage(chatJid, { text: notFoundText }, { quoted: msg });
          return;
        }

        // Fetch first verse as sample
        const sampleAyah = await fetchQuranAyah(`${meta.number}:1`);

        const summaryCombined = `🇬🇧 English Summary:
${meta.summaryEn}

🇵🇰 اردو خلاصہ:
${meta.summaryUr}`;

        const detailsText = `• Surah Name: ${meta.nameEn}
• Arabic Name: ${meta.nameAr}
• Urdu Name: ${meta.nameUr}
• Surah Number: ${meta.number} of 114
• Total Verses (Ayahs): ${meta.totalAyahs}
• Revelation Place: ${meta.revelationType} (${meta.revelationTypeAr} / ${meta.revelationTypeUr})
• Audio Recitation Link:
https://server8.mp3quran.net/afs/${String(meta.number).padStart(3, '0')}.mp3`;

        const responseText = formatIslamicBox({
          command: `surah ${meta.nameEn}`,
          arabic: `سُورَةُ ${meta.nameAr}\n\n${sampleAyah.arabic}`,
          transliteration: sampleAyah.transliteration,
          english: sampleAyah.english,
          urdu: sampleAyah.urdu,
          explanation: `${detailsText}\n\n━━━━━━━━━━━━━━━━━━\n\n📖 Surah Summary:\n${summaryCombined}`,
          source: 'Authentic Quranic Index Database'
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err: any) {
        console.error('[.surah Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'surah',
            explanation: `❌ Error processing .surah request. Please try again.`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 3. .ayah
  {
    name: 'ayah',
    aliases: ['aya', 'verseinfo'],
    category: '🕌 ISLAMIC',
    description: 'Get full text, transliteration, English, Urdu, and summary of an Ayah',
    usage: '.ayah <Surah:Ayah>',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim();

      if (!input || !input.includes(':')) {
        const usageBox = formatIslamicBox({
          command: 'ayah',
          explanation: `⚠️ Missing or invalid Ayah format.\n\nUsage Example:\n• .ayah 2:255\n• .ayah 36:58\n• .ayah 1:1`,
          source: 'Hijjaze Islamic Center'
        });
        await sock.sendMessage(chatJid, { text: usageBox }, { quoted: msg });
        return;
      }

      try {
        const data = await fetchQuranAyah(input);

        const explanationText = `• Surah: ${data.surahName} (Surah #${data.surahNumber})
• Ayah: ${data.ayahNumber}
• Juz: ${data.juzNumber || 1}
• Key Note: This blessed verse forms part of Allah's divine guidance in Surah ${data.surahName}.
• Audio Recitation:
${data.audioUrl || 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/262.mp3'}`;

        const responseText = formatIslamicBox({
          command: `ayah ${input}`,
          arabic: data.arabic,
          transliteration: data.transliteration,
          english: data.english,
          urdu: data.urdu,
          explanation: explanationText,
          source: data.source
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.ayah Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'ayah',
            explanation: `❌ Could not retrieve Ayah. Please check the reference format (e.g. .ayah 2:255).`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 4. .tafsir
  {
    name: 'tafsir',
    aliases: ['tafseer', 'explanation'],
    category: '🕌 ISLAMIC',
    description: 'Get authentic English and Urdu Tafsir, historical context, and lessons of an Ayah',
    usage: '.tafsir <Surah:Ayah>',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim();

      if (!input || !input.includes(':')) {
        const usageBox = formatIslamicBox({
          command: 'tafsir',
          explanation: `⚠️ Missing Ayah specification.\n\nUsage Example:\n• .tafsir 2:255\n• .tafsir 1:1\n• .tafsir 36:58`,
          source: 'Hijjaze Islamic Center'
        });
        await sock.sendMessage(chatJid, { text: usageBox }, { quoted: msg });
        return;
      }

      try {
        const tafsir = await fetchTafsirDetails(input);

        const explanationText = `📖 English Tafsir:
${tafsir.englishTafsir}

🇵🇰 اردو تفسیر:
${tafsir.urduTafsir}

━━━━━━━━━━━━━━━━━━

🏛 Historical Context (Asbab al-Nuzul):
• English: ${tafsir.historicalContextEn}
• اردو: ${tafsir.historicalContextUr}

━━━━━━━━━━━━━━━━━━

💡 Key Lessons:
• English:
${tafsir.lessonsEn}

• اردو:
${tafsir.lessonsUr}`;

        const responseText = formatIslamicBox({
          command: `tafsir ${input}`,
          arabic: tafsir.arabic,
          english: tafsir.englishTranslation,
          urdu: tafsir.urduTranslation,
          explanation: explanationText,
          source: tafsir.source
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.tafsir Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'tafsir',
            explanation: `❌ Failed to fetch Tafsir. Please verify the Ayah format (e.g. .tafsir 2:255).`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 5. .hadith
  {
    name: 'hadith',
    aliases: ['hadees', 'sunnah'],
    category: '🕌 ISLAMIC',
    description: 'Get authentic Hadith in Arabic, English, and Urdu from Sahih Bukhari, Muslim, etc.',
    usage: '.hadith [Bukhari | Muslim | Riyad]',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const collectionQuery = args.join(' ').trim().toLowerCase();

      try {
        let item: HadithItem | undefined = undefined;

        if (collectionQuery) {
          item = HADITH_DATABASE.find(h => h.collection.toLowerCase().includes(collectionQuery));
        }

        if (!item) {
          // Pick a random authentic Hadith from dataset
          item = HADITH_DATABASE[Math.floor(Math.random() * HADITH_DATABASE.length)];
        }

        const detailsText = `• Collection: ${item.collection}
• Hadith Number: #${item.hadithNumber}
• Narrator (EN): ${item.narratorEn}
• Narrator (UR): ${item.narratorUr}
• Authenticity Grade: ${item.grade}`;

        const responseText = formatIslamicBox({
          command: `hadith ${collectionQuery || 'random'}`,
          arabic: item.arabic,
          english: item.english,
          urdu: item.urdu,
          explanation: detailsText,
          source: `${item.collection} - Verified Authentic Hadith Database`
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.hadith Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'hadith',
            explanation: `❌ Error fetching Hadith. Usage: .hadith, .hadith Bukhari, .hadith Muslim`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 6. .dua
  {
    name: 'dua',
    aliases: ['supplication', 'masnoon'],
    category: '🕌 ISLAMIC',
    description: 'Get authentic Duas with Arabic, transliteration, English, Urdu, benefits, and references',
    usage: '.dua [travel | sleep | food | rain | protection | forgiveness]',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const topic = args.join(' ').trim().toLowerCase();

      try {
        let item: DuaItem | undefined = undefined;

        if (topic) {
          item = DUA_DATABASE.find(d => d.category.toLowerCase().includes(topic) || d.titleEn.toLowerCase().includes(topic));
        }

        if (!item) {
          item = DUA_DATABASE[Math.floor(Math.random() * DUA_DATABASE.length)];
        }

        const explanationText = `📌 Title: ${item.titleEn} (${item.titleUr})

💡 Benefits (English):
${item.benefitsEn}

💡 برکات و فوائد (اردو):
${item.benefitsUr}

📖 Reference:
${item.reference}`;

        const responseText = formatIslamicBox({
          command: `dua ${topic || 'random'}`,
          arabic: item.arabic,
          transliteration: item.transliteration,
          english: item.meaningEn,
          urdu: item.meaningUr,
          explanation: explanationText,
          source: 'Hisn al-Muslim (Fortress of the Muslim)'
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.dua Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'dua',
            explanation: `❌ Error fetching Dua. Usage: .dua travel, .dua sleep, .dua food, .dua rain`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 7. .prayer
  {
    name: 'prayer',
    aliases: ['namaz', 'salat', 'prayertimes'],
    category: '🕌 ISLAMIC',
    description: 'Get live daily prayer times with Hijri date for any city in Arabic, English, and Urdu',
    usage: '.prayer <City Name>',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const cityInput = args.join(' ').trim() || 'Karachi';

      try {
        const res = await fetchPrayerTimes(cityInput);

        const prayerTable = `• Fajr / الفجر / فجر: ${res.timings.Fajr}
• Sunrise / الشروق / طلوع آفتاب: ${res.timings.Sunrise}
• Dhuhr / الظهر / ظہر: ${res.timings.Dhuhr}
• Asr / العصر / عصر: ${res.timings.Asr}
• Maghrib / المغرب / مغرب: ${res.timings.Maghrib}
• Isha / العشاء / عشاء: ${res.timings.Isha}`;

        const detailsText = `🏙️ Location: ${res.city.toUpperCase()}
📅 Gregorian Date: ${res.gregorianDate}
🌙 Hijri Date: ${res.hijriDate}

━━━━━━━━━━━━━━━━━━

🕌 Daily Prayer Timings:

${prayerTable}

⚡ Note: Timings are dynamically calculated live for ${res.city}.`;

        const responseText = formatIslamicBox({
          command: `prayer ${cityInput}`,
          arabic: 'إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَوْقُوتًا',
          transliteration: 'Innas-Salata kanat \'alal-mu\'minina kitaban mawquta',
          english: 'Indeed, prayer has been decreed upon the believers a decree of specified times. (Quran 4:103)',
          urdu: 'بے شک نماز مومنوں پر مقررہ وقتوں میں فرض کی گئی ہے۔',
          explanation: detailsText,
          source: res.source
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.prayer Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'prayer',
            explanation: `❌ Could not fetch prayer times for "${cityInput}". Usage: .prayer Karachi, .prayer Makkah, .prayer London`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 8. .qibla
  {
    name: 'qibla',
    aliases: ['kaba', 'qibladirection'],
    category: '🕌 ISLAMIC',
    description: 'Calculate and display Qibla direction, compass angle, and map link for any city',
    usage: '.qibla <City Name>',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const cityInput = args.join(' ').trim() || 'Karachi';

      try {
        const qibla = await fetchQiblaDirection(cityInput);

        const detailsText = `🏙️ City: ${qibla.city.toUpperCase()}
🧭 Qibla Angle: ${qibla.directionDegrees}°
📍 Compass Direction: ${qibla.compassDirection}
🧭 General Direction: ${qibla.generalDescription}

🗺️ Google Maps Location & Direction Link:
${qibla.mapUrl}`;

        const responseText = formatIslamicBox({
          command: `qibla ${cityInput}`,
          arabic: 'فَوَلِّ وَجْهَكَ شَطْرَ الْمَسْجِدِ الْحَرَامِ ۚ وَحَيْثُ مَا كُنْتُمْ فَوَلُّوا وُجُوهَكُمْ شَطْرَهُ',
          transliteration: 'Fa walli wajhaka shatral-Masjidil-Haram, wa haythu ma kuntum fa wallu wujuhakum shatrah',
          english: 'So turn your face toward al-Masjid al-Haram. And wherever you [believers] are, turn your faces toward it in prayer. (Quran 2:144)',
          urdu: 'پس اپنا منہ مسجد حرام (کعبہ) کی طرف پھیر لو، اور تم جہاں بھی ہو اپنے منہ اسی کی طرف پھیرا کرو۔',
          explanation: detailsText,
          source: qibla.source
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.qibla Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'qibla',
            explanation: `❌ Failed to calculate Qibla direction for "${cityInput}". Usage: .qibla Karachi, .qibla Islamabad`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 9. .zikr
  {
    name: 'zikr',
    aliases: ['dhikr', 'azkar', 'tasbeeh'],
    category: '🕌 ISLAMIC',
    description: 'Get daily morning, evening, and general Azkar with counts and virtues',
    usage: '.zikr [morning | evening]',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim().toLowerCase();

      try {
        let item: ZikrItem | undefined = undefined;
        if (input) {
          item = ZIKR_DATABASE.find(z => z.category.toLowerCase().includes(input));
        }

        if (!item) {
          item = ZIKR_DATABASE[Math.floor(Math.random() * ZIKR_DATABASE.length)];
        }

        const detailsText = `📿 Recommended Count: ${item.count}

💡 Benefits (English):
${item.benefitsEn}

💡 برکات و فوائد (اردو):
${item.benefitsUr}

📖 Authentic Reference:
${item.reference}`;

        const responseText = formatIslamicBox({
          command: `zikr ${input || 'general'}`,
          arabic: item.arabic,
          transliteration: item.transliteration,
          english: item.meaningEn,
          urdu: item.meaningUr,
          explanation: detailsText,
          source: 'Authentic Azkar & Sunnah Database'
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.zikr Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: 'zikr',
            explanation: `❌ Error fetching Zikr. Usage: .zikr, .zikr morning, .zikr evening`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  },

  // 10. .99names
  {
    name: '99names',
    aliases: ['namesofallah', 'asmaulhusna', 'allahnames'],
    category: '🕌 ISLAMIC',
    description: 'Browse the 99 Beautiful Names of Allah (Asma-ul-Husna) with meanings and explanations',
    usage: '.99names [Number | Name]',
    handler: async (ctx) => {
      const { sock, msg, chatJid, args } = ctx;
      const input = args.join(' ').trim().toLowerCase();

      try {
        let nameObj: AllahName | undefined = undefined;

        if (input) {
          const num = parseInt(input, 10);
          if (!isNaN(num)) {
            nameObj = ALLAH_NAMES_99.find(n => n.id === num);
          } else {
            const cleanInput = input.replace(/[^a-z0-9]/g, '');
            nameObj = ALLAH_NAMES_99.find(n => n.transliteration.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanInput));
          }
        }

        if (!nameObj) {
          // If no argument or not found, pick a random Name of Allah
          nameObj = ALLAH_NAMES_99[Math.floor(Math.random() * ALLAH_NAMES_99.length)];
        }

        const detailsText = `🔢 Name Number: #${nameObj.id} of 99
✨ Transliteration: ${nameObj.transliteration}

📖 English Explanation:
${nameObj.explanationEn}

📖 اردو وضاحت:
${nameObj.explanationUr}

📌 Info: Type .99names <1-99> or .99names Ar-Rahman to look up a specific Divine Name.`;

        const responseText = formatIslamicBox({
          command: `99names ${input || nameObj.id}`,
          arabic: nameObj.arabic,
          transliteration: nameObj.transliteration,
          english: nameObj.meaningEn,
          urdu: nameObj.meaningUr,
          explanation: detailsText,
          source: 'Asma-ul-Husna (The 99 Beautiful Names of Allah)'
        });

        await sock.sendMessage(chatJid, { text: responseText }, { quoted: msg });
      } catch (err) {
        console.error('[.99names Command Error]:', err);
        await sock.sendMessage(chatJid, {
          text: formatIslamicBox({
            command: '99names',
            explanation: `❌ Error fetching Name of Allah. Usage: .99names, .99names 1, .99names Ar-Rahman`,
            source: 'Hijjaze Islamic Center'
          })
        }, { quoted: msg });
      }
    }
  }
];
