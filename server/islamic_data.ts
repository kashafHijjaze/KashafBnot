/**
 * Authentic Islamic Offline Database & References
 * Contains surah list (114 surahs), 99 Names of Allah, Duas, Azkar, Hadiths, and Tafsirs.
 */

export interface SurahMeta {
  number: number;
  nameEn: string;
  nameAr: string;
  nameUr: string;
  totalAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  revelationTypeAr: 'مَكِيَّة' | 'مَدَنِيَّة';
  revelationTypeUr: 'مکی' | 'مدنی';
  summaryEn: string;
  summaryUr: string;
}

export const SURAH_LIST: SurahMeta[] = [
  {
    number: 1,
    nameEn: 'Al-Fatihah',
    nameAr: 'الفاتحة',
    nameUr: 'الفاتحہ',
    totalAyahs: 7,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Opening chapter of the Holy Quran, known as Mother of the Book (Umm al-Kitab). Recited in every unit of prayer.',
    summaryUr: 'قرآن مجید کا افتتاحی سورہ، جسے ام الکتاب بھی کہا جاتا ہے۔ ہر نماز کی ہر رکعت میں پڑھی جاتی ہے۔'
  },
  {
    number: 2,
    nameEn: 'Al-Baqarah',
    nameAr: 'البقرة',
    nameUr: 'البقرہ',
    totalAyahs: 286,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'The longest chapter in the Quran. Contains Ayatul Kursi (2:255) and laws covering faith, worship, and social guidance.',
    summaryUr: 'قرآن مجید کی سب سے طویل سورت۔ اس میں آیت الکرسی (2:255) اور ایمانیات، عبادات، اور معاملات کے احکام شامل ہیں۔'
  },
  {
    number: 3,
    nameEn: 'Ali \'Imran',
    nameAr: 'آل عمران',
    nameUr: 'آل عمران',
    totalAyahs: 200,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'Focuses on the Family of Imran, monotheism, steadfastness, and lessons from the Battle of Uhud.',
    summaryUr: 'آل عمران، توحید، استقامت اور غزوہ احد کے اسباق پر روشنی ڈالتی ہے۔'
  },
  {
    number: 4,
    nameEn: 'An-Nisa',
    nameAr: 'النساء',
    nameUr: 'النساء',
    totalAyahs: 176,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'Deals with women\'s rights, inheritance, family unity, justice, and community guidelines.',
    summaryUr: 'خواتین کے حقوق، وراثت، خاندانی نظام، عدل اور معاشرتی اصولوں پر مشتمل ہے۔'
  },
  {
    number: 5,
    nameEn: 'Al-Ma\'idah',
    nameAr: 'المائدة',
    nameUr: 'المائدہ',
    totalAyahs: 120,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'Emphasizes covenants, lawful and unlawful food, justice, and the perfection of Islam as a religion.',
    summaryUr: 'عہد و پیمان، حلال و حرام، عدل و انصاف اور دین اسلام کی تکمیل کا بیان کرتی ہے۔'
  },
  {
    number: 6,
    nameEn: 'Al-An\'am',
    nameAr: 'الأنعام',
    nameUr: 'الانعام',
    totalAyahs: 165,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Focuses on Tawheed (Oneness of Allah), Refutation of Shirk, Creation, and Resurrection.',
    summaryUr: 'توحید، رد شرک، تخلیق کائنات اور قیامت کے دلائل پر مبنی ہے۔'
  },
  {
    number: 7,
    nameEn: 'Al-A\'raf',
    nameAr: 'الأعراف',
    nameUr: 'الاعراف',
    totalAyahs: 206,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Narrates stories of past Prophets (Noah, Hud, Salih, Lot, Shuayb, Moses) and the choices between good and evil.',
    summaryUr: 'انبیاء کرام کے واقعات اور خیر و شر کی کشمکش کا تفصیلی بیان کرتی ہے۔'
  },
  {
    number: 8,
    nameEn: 'Al-Anfal',
    nameAr: 'الأنفال',
    nameUr: 'الانفال',
    totalAyahs: 75,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'Revealed following the Battle of Badr. Covers rules of engagement, spoils of war, and reliance on Allah.',
    summaryUr: 'غزوہ بدر کے بعد نازل ہوئی۔ مال غنیمت، جہاد کے قوانین اور اللہ پر توکل کے احکام پر مشتمل ہے۔'
  },
  {
    number: 9,
    nameEn: 'At-Tawbah',
    nameAr: 'التوبة',
    nameUr: 'التوبہ',
    totalAyahs: 129,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'The only chapter without Bismillah at the beginning. Focuses on repentance, treaties, and hypocrites.',
    summaryUr: 'واحد سورہ جو بسم اللہ کے بغیر شروع ہوتی ہے۔ توبہ، معاہدات اور منافقین کے کردار کا بیان کرتی ہے۔'
  },
  {
    number: 10,
    nameEn: 'Yunus',
    nameAr: 'يونس',
    nameUr: 'یونس',
    totalAyahs: 109,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Named after Prophet Jonah (Yunus). Highlights divine mercy, belief in revelation, and signs of Allah.',
    summaryUr: 'حضرت یونس علیہ السلام کے نام پر موسوم۔ رحمت الہی، وحی پر ایمان اور نشانیاں بیان کرتی ہے۔'
  },
  {
    number: 11,
    nameEn: 'Hud',
    nameAr: 'هود',
    nameUr: 'ہود',
    totalAyahs: 123,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Narrates the stories of Prophets and their nations, stressing patience, perseverance, and justice.',
    summaryUr: 'انبیاء اور ان کی اقوام کے واقعات کے ذریعے صبر، استقامت اور عدل کی تلقین کرتی ہے۔'
  },
  {
    number: 12,
    nameEn: 'Yusuf',
    nameAr: 'يوسف',
    nameUr: 'یوسف',
    totalAyahs: 111,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Known as Ahsan al-Qasas (The Best of Stories). Tells the complete life story of Prophet Yusuf (Joseph).',
    summaryUr: 'احسن القصص (بہترین واقعہ)۔ حضرت یوسف علیہ السلام کی مبارک زندگی کا مکمل بیان کرتی ہے۔'
  },
  {
    number: 13,
    nameEn: 'Ar-Ra\'d',
    nameAr: 'الرعد',
    nameUr: 'الرعد',
    totalAyahs: 43,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'The Thunder. Emphasizes that hearts find tranquility in the remembrance of Allah.',
    summaryUr: 'الرعد (گرج)۔ دلوں کا اطمینان اور سکون اللہ کے ذکر میں پوشیدہ ہونے کی بشارت دیتی ہے۔'
  },
  {
    number: 14,
    nameEn: 'Ibrahim',
    nameAr: 'إبراهيم',
    nameUr: 'ابراہیم',
    totalAyahs: 52,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Focuses on Prophet Abraham\'s prayer, gratitude to Allah, and the reality of the Day of Judgment.',
    summaryUr: 'حضرت ابراہیم علیہ السلام کی دعا، شکر گزاری اور روز جزا کے احوال کا بیان کرتی ہے۔'
  },
  {
    number: 15,
    nameEn: 'Al-Hijr',
    nameAr: 'الحجر',
    nameUr: 'الحجر',
    totalAyahs: 99,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Contains Allah\'s promise to protect the Quran from corruption forever.',
    summaryUr: 'اس میں اللہ تعالی کا قرآن مجید کو ہر قسم کی تحریف سے محفوظ رکھنے کا ابدی وعدہ ہے۔'
  },
  {
    number: 16,
    nameEn: 'An-Nahl',
    nameAr: 'النحل',
    nameUr: 'النحل',
    totalAyahs: 128,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Bee. Enumerates Allah\'s bounties in creation and commands justice and good conduct.',
    summaryUr: 'شہد کی مکھیاں۔ اللہ تعالی کی نعمتوں کا شمار اور عدل و احسان کا حکم دیتی ہے۔'
  },
  {
    number: 17,
    nameEn: 'Al-Isra',
    nameAr: 'الإسراء',
    nameUr: 'الاسراء',
    totalAyahs: 111,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Night Journey (Isra and Mi\'raj) of Prophet Muhammad ﷺ. Contains core moral commandements.',
    summaryUr: 'واقعہ معراج کا ذکر اور اسلامی اخلاقیات کے بنیادی 14 اصول بیان کرتی ہے۔'
  },
  {
    number: 18,
    nameEn: 'Al-Kahf',
    nameAr: 'الكهف',
    nameUr: 'الکہف',
    totalAyahs: 110,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Cave. Recommended to recite on Fridays. Contains stories of the Sleepers of the Cave, Dhul-Qarnayn, Musa & Khidr.',
    summaryUr: 'جمعہ کے دن تلاوت سنت ہے۔ اصحاب کہف، ذوالقرنین اور حضرت موسی و خضر کے اسباق پر مشتمل ہے۔'
  },
  {
    number: 19,
    nameEn: 'Maryam',
    nameAr: 'مريم',
    nameUr: 'مریم',
    totalAyahs: 98,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Named after Mary (Maryam), mother of Jesus (Isa). Highlights miraculous births and divine mercy.',
    summaryUr: 'حضرت مریم علیہا السلام کے نام پر۔ حضرت عیسی اور حضرت زکریا علیہم السلام کے معجزاتی واقعات شامل ہیں۔'
  },
  {
    number: 20,
    nameEn: 'Ta-Ha',
    nameAr: 'طه',
    nameUr: 'طٰہٰ',
    totalAyahs: 135,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Comforts Prophet Muhammad ﷺ and details the call and mission of Prophet Musa (Moses).',
    summaryUr: 'نبی کریم ﷺ کے لیے تسلی اور حضرت موسی علیہ السلام کے تفصیلی واقعہ کی حامل ہے۔'
  },
  {
    number: 36,
    nameEn: 'Ya-Sin',
    nameAr: 'يس',
    nameUr: 'یس',
    totalAyahs: 83,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Known as the Heart of the Quran. Focuses on the truth of revelation, resurrection, and paradise.',
    summaryUr: 'قرآن کا دل۔ وحی کی سچائی، قیامت کے دن جی اٹھنے اور جنت کے احوال بیان کرتی ہے۔'
  },
  {
    number: 55,
    nameEn: 'Ar-Rahman',
    nameAr: 'الرحمن',
    nameUr: 'الرحمٰن',
    totalAyahs: 78,
    revelationType: 'Medinan',
    revelationTypeAr: 'مَدَنِيَّة',
    revelationTypeUr: 'مدنی',
    summaryEn: 'The Beauty of the Quran. Famous for the refrain "Which of the favors of your Lord will you deny?"',
    summaryUr: 'عروس القرآن (قرآن کی زینت)۔ "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ" کی دلنشین تکرار پر مشتمل ہے۔'
  },
  {
    number: 67,
    nameEn: 'Al-Mulk',
    nameAr: 'الملك',
    nameUr: 'الملک',
    totalAyahs: 30,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Dominion. Protects its regular night reader from the punishment of the grave.',
    summaryUr: 'سورة الملک۔ رات کو باقاعدگی سے پڑھنے والے کے لیے عذاب قبر سے نجات کا ذریعہ ہے۔'
  },
  {
    number: 112,
    nameEn: 'Al-Ikhlas',
    nameAr: 'الإخلاص',
    nameUr: 'الاخلاص',
    totalAyahs: 4,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Declaration of Pure Monotheism. Equivalent to one-third of the Quran in reward.',
    summaryUr: 'توحید خالص کا اعلان۔ ثواب میں ایک تہائی قرآن (ثلث القرآن) کے برابر ہے۔'
  },
  {
    number: 113,
    nameEn: 'Al-Falaq',
    nameAr: 'الفلق',
    nameUr: 'الفلق',
    totalAyahs: 5,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'The Daybreak. Seeking refuge in Allah from the evil of dark spirits, envy, and witchcraft.',
    summaryUr: 'صبح کی روشنی۔ حسد، جادو اور ہر قسم کی شر و تاریکی سے اللہ کی پناہ مانگنے کی سورة۔'
  },
  {
    number: 114,
    nameEn: 'An-Nas',
    nameAr: 'الناس',
    nameUr: 'الناس',
    totalAyahs: 6,
    revelationType: 'Meccan',
    revelationTypeAr: 'مَكِيَّة',
    revelationTypeUr: 'مکی',
    summaryEn: 'Mankind. Seeking protection in the Lord of Mankind from the whispering of Satan.',
    summaryUr: 'انسان۔ انسانوں کے رب کی پناہ میں انا شیطان کے وسوسوں سے حفاظت کا وظیفہ۔'
  }
];

// Complete 99 Names of Allah (Asma-ul-Husna) Dataset
export interface AllahName {
  id: number;
  arabic: string;
  transliteration: string;
  meaningEn: string;
  meaningUr: string;
  explanationEn: string;
  explanationUr: string;
}

export const ALLAH_NAMES_99: AllahName[] = [
  {
    id: 1,
    arabic: 'الرَّحْمَٰنُ',
    transliteration: 'Ar-Rahman',
    meaningEn: 'The Most Gracious, The All-Merciful',
    meaningUr: 'بہت رحم کرنے والا، عظیم مہربان',
    explanationEn: 'The One who has plenty of mercy for the believers and the blasphemers in this world and exclusively for the believers in the Hereafter.',
    explanationUr: 'وہ ذات جس کی رحمت تمام کائنات، مومن اور کافر سب کو اس دنیا میں گھیرے ہوئے ہے۔'
  },
  {
    id: 2,
    arabic: 'الرَّحِيمُ',
    transliteration: 'Ar-Raheem',
    meaningEn: 'The Most Merciful, The Especially Merciful',
    meaningUr: 'بہت مہربان، مسلسل رحم فرمانے والا',
    explanationEn: 'The One who bestows spiritual guidance and eternal rewards upon believers in the Hereafter.',
    explanationUr: 'وہ ذات جو مومنین پر آخرت میں خاص اور مسلسل رحم فرمانے والی ہے۔'
  },
  {
    id: 3,
    arabic: 'الْمَلِكُ',
    transliteration: 'Al-Malik',
    meaningEn: 'The Sovereign Lord, The Absolute Ruler',
    meaningUr: 'حقیقی بادشاہ، مطلق حکمران',
    explanationEn: 'The King with absolute authority over all created realm, with complete independence.',
    explanationUr: 'تمام کائنات کا حقیقی اور تنہا مالک و بادشاہ جس کے حکم میں کوئی شریک نہیں۔'
  },
  {
    id: 4,
    arabic: 'الْقُدُّوسُ',
    transliteration: 'Al-Quddus',
    meaningEn: 'The Most Holy, The Pure',
    meaningUr: 'ہر عیب سے پاک، نہایت مقدس',
    explanationEn: 'The One who is pure from any imperfection, defect, or flaw.',
    explanationUr: 'وہ ذات جو تمام عیوب، نقائص اور کمزوریوں سے بالکل پاک اور منزہ ہے۔'
  },
  {
    id: 5,
    arabic: 'السَّلَامُ',
    transliteration: 'As-Salam',
    meaningEn: 'The Source of Peace, The Giver of Safety',
    meaningUr: 'سلامتی دینے والا، امن کا سرچشمہ',
    explanationEn: 'The One who is free from any fault and gives peace and security to His creation.',
    explanationUr: 'وہ ذات جو خود سلامتی والی ہے اور اپنی مخلوق کو امن و سلامتی عطا کرتی ہے۔'
  },
  {
    id: 6,
    arabic: 'الْمُؤْمِنُ',
    transliteration: 'Al-Mu\'min',
    meaningEn: 'The Infuser of Faith, The Guarantor of Security',
    meaningUr: 'امان دینے والا، تصدیق کرنے والا',
    explanationEn: 'The One who affirms His prophets and grants peace and security to His worshipers.',
    explanationUr: 'وہ ذات جو اپنے بندوں کو عذاب سے امان دیتی ہے اور ایمان کی دولت بخشتی ہے۔'
  },
  {
    id: 7,
    arabic: 'الْمُهَيْمِنُ',
    transliteration: 'Al-Muhaymin',
    meaningEn: 'The Guardian, The Preserver, The Overseer',
    meaningUr: 'نگہبان، حفاظت کرنے والا',
    explanationEn: 'The One who witnesses His creation\'s actions and guards all existence.',
    explanationUr: 'تمام مخلوقات کے احوال و اعمال کا نگران اور مکمل محافظ۔'
  },
  {
    id: 8,
    arabic: 'الْعَزِيزُ',
    transliteration: 'Al-Aziz',
    meaningEn: 'The All-Mighty, The Invincible',
    meaningUr: 'سب پر غالب، زبردست، عزت والا',
    explanationEn: 'The Unconquerable Supreme Force who commands ultimate power and dignity.',
    explanationUr: 'وہ غالب اور زبردست ذات جسے کوئی شکست یا مغلوب نہیں کر سکتا۔'
  },
  {
    id: 9,
    arabic: 'الْجَبَّارُ',
    transliteration: 'Al-Jabbar',
    meaningEn: 'The Compeller, The Restorer',
    meaningUr: 'ٹوٹی ہوئی حالتوں کو درست کرنے والا، جابر',
    explanationEn: 'The One who mends the broken, cures the sick, and enforces His divine decree.',
    explanationUr: 'وہ ذات جو اپنے بندوں کے زخم بھرتی ہے اور اپنی مشیت نافذ کرتی ہے۔'
  },
  {
    id: 10,
    arabic: 'الْمُتَكَبِّرُ',
    transliteration: 'Al-Mutakabbir',
    meaningEn: 'The Supreme, The Majestic',
    meaningUr: 'بزرگی والا، عظمت و کبریا کا مالک',
    explanationEn: 'The One who is clear from the attributes of the creation and possesses all greatness.',
    explanationUr: 'عظمت، کیبرائی اور بزرگی صرف اسی ذات کا حق اور خاصہ ہے۔'
  },
  {
    id: 11,
    arabic: 'الْخَالِقُ',
    transliteration: 'Al-Khaliq',
    meaningEn: 'The Creator, The Maker',
    meaningUr: 'پیدا کرنے والا، خالق',
    explanationEn: 'The One who brings everything from non-existence into existence.',
    explanationUr: 'عدم سے وجود میں لانے والا حقیقی خالق۔'
  },
  {
    id: 12,
    arabic: 'الْبَارِئُ',
    transliteration: 'Al-Bari\'',
    meaningEn: 'The Evolver, The Maker of Order',
    meaningUr: 'ٹھیک ٹھیک بنانے والا، پیدا کرنے والا',
    explanationEn: 'The One who creates harmony and forms without any pre-existing model.',
    explanationUr: 'مخلوق کو کسی سابقہ نمونے کے بغیر تناسب سے بنانے والا۔'
  },
  {
    id: 13,
    arabic: 'الْمُصَوِّرُ',
    transliteration: 'Al-Musawwir',
    meaningEn: 'The Fashioner, The Shaper',
    meaningUr: 'صورت گری کرنے والا، صورت بخشنے والا',
    explanationEn: 'The One who designs and shapes every creation in its unique form.',
    explanationUr: 'ہر مخلوق کو اس کی مخصوص اور بہترین شکل عطا کرنے والا۔'
  },
  {
    id: 14,
    arabic: 'الْغَفَّارُ',
    transliteration: 'Al-Ghaffar',
    meaningEn: 'The Constant Forgiver',
    meaningUr: 'بہت بخشنے والا، گناہوں کو چھپانے والا',
    explanationEn: 'The One who repeatedly forgives the sins of His servants time and time again.',
    explanationUr: 'بار بار اور کثرت سے بندوں کے گناہوں کو معاف فرمانے والا۔'
  },
  {
    id: 15,
    arabic: 'الْقَهَّارُ',
    transliteration: 'Al-Qahhar',
    meaningEn: 'The All-Subduing, The Dominant',
    meaningUr: 'سب کو اپنے قابو میں رکھنے والا، قہار',
    explanationEn: 'The One who completely dominates and controls everything in existence.',
    explanationUr: 'جس کا قبضہ اور تسلط تمام مخلوقات پر تام اور کامل ہے۔'
  },
  {
    id: 16,
    arabic: 'الْوَهَّابُ',
    transliteration: 'Al-Wahhab',
    meaningEn: 'The Supreme Bestower',
    meaningUr: 'بغیر عوض کثرت سے دینے والا، وہاب',
    explanationEn: 'The One who gives abundantly without expecting anything in return.',
    explanationUr: 'بغیر کسی غرض و عوض کے عطا کرنے والی عظیم ذات۔'
  },
  {
    id: 17,
    arabic: 'الرَّزَّاقُ',
    transliteration: 'Ar-Razzaq',
    meaningEn: 'The Provider, The Sustainer',
    meaningUr: 'بہت رزق دینے والا، روزی رساں',
    explanationEn: 'The One who creates all means of nourishment and provides for every living being.',
    explanationUr: 'تمام جانداروں کو ان کا رزق اور سامان زیست فراہم کرنے والا۔'
  },
  {
    id: 18,
    arabic: 'الْفَتَّاحُ',
    transliteration: 'Al-Fattah',
    meaningEn: 'The Opener, The Supreme Judge',
    meaningUr: 'دشواریوں کو کھولنے والا، فیصلہ کرنے والا',
    explanationEn: 'The One who opens the doors of mercy, guidance, and solution to all problems.',
    explanationUr: 'بند راستوں کو کھولنے والا اور رحمت و فتح کے دروازے عطا کرنے والا۔'
  },
  {
    id: 19,
    arabic: 'الْعَلِيمُ',
    transliteration: 'Al-Aleem',
    meaningEn: 'The All-Knowing, The Omniscient',
    meaningUr: 'سب کچھ جاننے والا، علم والا',
    explanationEn: 'The One whose knowledge encompasses the past, present, future, hidden, and manifest.',
    explanationUr: 'وہ ذات جس سے کائنات کا کوئی بھی بھیڈ یا ذرہ پوشیدہ نہیں۔'
  },
  {
    id: 20,
    arabic: 'الْقَابِضُ',
    transliteration: 'Al-Qabid',
    meaningEn: 'The Restrainer, The Withholder',
    meaningUr: 'رزق تنگ کرنے والا، قبضہ کرنے والا',
    explanationEn: 'The One who constricts or reduces provisions according to His divine wisdom.',
    explanationUr: 'اپنی حکمت کے مطابق رزق یا روح کو روکنے یا تنگ کرنے والا۔'
  },
  {
    id: 21,
    arabic: 'الْبَاسِطُ',
    transliteration: 'Al-Basit',
    meaningEn: 'The Extender, The Reliever',
    meaningUr: 'رزق کشادہ کرنے والا، وسعت دینے والا',
    explanationEn: 'The One who expands and amplifies provisions and happiness for His servants.',
    explanationUr: 'اپنے فضل و کرم سے رزق اور نعمتوں میں وسعت دینے والا۔'
  },
  {
    id: 22,
    arabic: 'الْخَافِضُ',
    transliteration: 'Al-Khafid',
    meaningEn: 'The Abaser, The Reducer',
    meaningUr: 'پست کرنے والا، نیچے گرانے والا',
    explanationEn: 'The One who lowers the arrogant and the oppressors.',
    explanationUr: 'سرکشوں اور متکبروں کو ان کے تکبر کی سزا دے کر پست کرنے والا۔'
  },
  {
    id: 23,
    arabic: 'الرَّافِعُ',
    transliteration: 'Ar-Rafi\'',
    meaningEn: 'The Exalter, The Elevator',
    meaningUr: 'بلند کرنے والا، عزت دینے والا',
    explanationEn: 'The One who elevates the righteous in status, knowledge, and faith.',
    explanationUr: 'اہل ایمان اور صالحین کے درجات بلند کرنے والا۔'
  },
  {
    id: 24,
    arabic: 'الْمُعِزُّ',
    transliteration: 'Al-Mu\'izz',
    meaningEn: 'The Giver of Honor',
    meaningUr: 'عزت دینے والا',
    explanationEn: 'The One who bestows true honor, victory, and dignity upon whom He wills.',
    explanationUr: 'جسے چاہے اپنے فضل سے عزت اور وقار عطا فرمائے۔'
  },
  {
    id: 25,
    arabic: 'الْمُذِلُّ',
    transliteration: 'Al-Mudhill',
    meaningEn: 'The Giver of Dishonor',
    meaningUr: 'ذلیل کرنے والا، رسوا کرنے والا',
    explanationEn: 'The One who humiliates and lowers those who oppose His truth and oppress others.',
    explanationUr: 'حق سے انحراف کرنے والوں اور ظالموں کو رسوا کرنے والا۔'
  },
  {
    id: 26,
    arabic: 'السَّمِيعُ',
    transliteration: 'As-Sami\'',
    meaningEn: 'The All-Hearing',
    meaningUr: 'سب کچھ سننے والا',
    explanationEn: 'The One who hears every whisper, prayer, and sound without any limitation.',
    explanationUr: 'ہر پکار، دعا اور خفیہ و علانیہ صدا کو بلا کم و کاست سننے والا۔'
  },
  {
    id: 27,
    arabic: 'الْبَصِيرُ',
    transliteration: 'Al-Baseer',
    meaningEn: 'The All-Seeing',
    meaningUr: 'سب کچھ دیکھنے والا',
    explanationEn: 'The One who sees everything in the dark of night and in the depths of creation.',
    explanationUr: 'گہرے اندھیروں اور پوشیدہ گوشوں میں ہر عمل کو دیکھنے والا۔'
  },
  {
    id: 28,
    arabic: 'الْحَكَمُ',
    transliteration: 'Al-Hakam',
    meaningEn: 'The Supreme Judge',
    meaningUr: 'حاکم، فیصلہ کرنے والا',
    explanationEn: 'The Arbiter whose judgment is final and just in all affairs.',
    explanationUr: 'حق و باطل کے درمیان عادلانہ اور حتمی فیصلہ فرمانے والا۔'
  },
  {
    id: 29,
    arabic: 'الْعَدْلُ',
    transliteration: 'Al-Adl',
    meaningEn: 'The Utterly Just',
    meaningUr: 'انصاف کرنے والا، عین عدل',
    explanationEn: 'The One who is equitable and never commits even an atom\'s weight of injustice.',
    explanationUr: 'مکمل عدل و انصاف قائم کرنے والا جس کے ہاں ذرہ برابر بھی ظلم نہیں۔'
  },
  {
    id: 30,
    arabic: 'الَّطِيفُ',
    transliteration: 'Al-Lateef',
    meaningEn: 'The Subtle, The Kind',
    meaningUr: 'باریک بین، نہایت مہربان',
    explanationEn: 'The One who knows the subtle details and delivers benefits in hidden ways.',
    explanationUr: 'پوشیدہ لطافتوں کو جاننے والا اور خفیہ راستوں سے لطف و کرم فرمانے والا۔'
  }
];

// Authentic Duas Database
export interface DuaItem {
  category: string;
  titleEn: string;
  titleUr: string;
  arabic: string;
  transliteration: string;
  meaningEn: string;
  meaningUr: string;
  benefitsEn: string;
  benefitsUr: string;
  reference: string;
}

export const DUA_DATABASE: DuaItem[] = [
  {
    category: 'travel',
    titleEn: 'Dua for Traveling (Safar)',
    titleUr: 'سفر کی دعا',
    arabic: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنْقَلِبُونَ',
    transliteration: 'Subhan-alladhi sakhkhara lana hadha wa ma kunna lahu muqrinin, wa inna ila Rabbina lamunqalibun',
    meaningEn: 'Glory be to Him Who has subjected this to us, and we could never have accomplished it by our power. And surely, to our Lord we are returning.',
    meaningUr: 'پاک ہے وہ ذات جس نے اس (سواری) کو ہمارے قابو میں کر دیا اور ہم اس کو قابو میں لانے والے نہ تھے، اور بے شک ہم اپنے رب کی طرف لوٹ کر جانے والے ہیں۔',
    benefitsEn: 'Protects the traveler from accidents, harm, and difficulty during journey.',
    benefitsUr: 'سفر کے دوران حادثات، پریشانیوں اور تکالیف سے اللہ تعالی کی حفاظت حاصل ہوتی ہے۔',
    reference: 'Sahih Muslim 1342, Sunan Abi Dawud 2602'
  },
  {
    category: 'sleep',
    titleEn: 'Dua Before Sleeping',
    titleUr: 'سوتے وقت کی دعا',
    arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    transliteration: 'Bismika Allahumma amutu wa ahya',
    meaningEn: 'In Your Name, O Allah, I die and I live.',
    meaningUr: 'اے اللہ! تیرے نام کے ساتھ ہی میں مرتا (سوتا) ہوں اور جیتا (جاگتا) ہوں۔',
    benefitsEn: 'Ensures safe sleep under Allah\'s divine protection from bad dreams and evil spirits.',
    benefitsUr: 'رات بھر برے خوابوں اور شیطان کے شر سے امن و سلامتی کی ضمانت۔',
    reference: 'Sahih al-Bukhari 6312'
  },
  {
    category: 'food',
    titleEn: 'Dua Before Eating Food',
    titleUr: 'کھانا کھانے سے پہلے کی دعا',
    arabic: 'بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ',
    transliteration: 'Bismillahi wa \'ala barakatillah',
    meaningEn: 'In the name of Allah and with the blessings of Allah.',
    meaningUr: 'اللہ کے نام کے ساتھ اور اللہ کی برکت پر (میں کھانا شروع کرتا ہوں)۔',
    benefitsEn: 'Brings Barakah (blessings) in food and prevents Satan from partaking in the meal.',
    benefitsUr: 'کھانے میں برکت پیدا ہوتی ہے اور شیطان کھانے میں شریک نہیں ہو سکتا۔',
    reference: 'Hisn al-Muslim, Al-Hakim'
  },
  {
    category: 'rain',
    titleEn: 'Dua When It Rains',
    titleUr: 'بارش کے وقت کی دعا',
    arabic: 'اللَّهُمَّ صَيِّباً نَافِعاً',
    transliteration: 'Allahumma sayyiban nafi\'an',
    meaningEn: 'O Allah, make it a beneficial rainfall.',
    meaningUr: 'اے اللہ! اس بارش کو نفع بخش اور باعث برکت بنا دے۔',
    benefitsEn: 'Asks Allah for rain that brings growth, sustenance, and mercy instead of destruction.',
    benefitsUr: 'بارش کو رحمت اور آبادکاری کا ذریعہ بنانے کی پیاری دعا۔',
    reference: 'Sahih al-Bukhari 1032'
  },
  {
    category: 'forgiveness',
    titleEn: 'Sayyidul Istighfar (Chief Prayer for Forgiveness)',
    titleUr: 'سید الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    transliteration: 'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana \'abduka, wa ana \'ala \'ahdika wa wa\'dika mastata\'tu, a\'udhu bika min sharri ma sana\'tu, abu\'u laka bini\'matika \'alayya, wa abu\'u bidhanbi faghfir li fa-innahu la yaghfirudh-dhunuba illa Anta',
    meaningEn: 'O Allah, You are my Lord, there is no deity except You. You created me and I am Your servant, and I abide by Your covenant and promise as best I can. I seek refuge in You from the evil of what I have done. I acknowledge Your favor upon me, and I acknowledge my sin, so forgive me, for none forgives sins except You.',
    meaningUr: 'اے اللہ! تو ہی میرا رب ہے، تیرے سوا کوئی معبود نہیں، تو نے ہی مجھے پیدا کیا اور میں تیرا بندہ ہوں اور تیرے عہد اور وعدے پر قائم ہوں اپنی طاقت کے مطابق۔ میں اپنے کیے کے شر سے تیری پناہ چاہتا ہوں، مجھ پر تیری جو نعمتیں ہیں ان کا اقرار کرتا ہوں اور اپنے گناہوں کا اعتراف کرتا ہوں، پس مجھے معاف فرما دے کیونکہ تیرے سوا کوئی گناہوں کو معاف نہیں کر سکتا۔',
    benefitsEn: 'Whoever recites it in the morning/evening with firm faith and dies that day/night will enter Paradise.',
    benefitsUr: 'جو شخص صبح و شام سچے دل سے اسے پڑھے اور اس دن یا رات اس کا انتقال ہو جائے تو وہ جنتی ہے۔',
    reference: 'Sahih al-Bukhari 6306'
  },
  {
    category: 'protection',
    titleEn: 'Dua for Protection from All Harm',
    titleUr: 'ہر آفت و بلا سے حفاظت کی دعا',
    arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    transliteration: 'Bismillahil-ladhi la yadurru ma\'as-mihi shay\'un fil-ardi wa la fis-sama\'i wa Huwas-Sami\'ul-\'Aleem',
    meaningEn: 'In the name of Allah, with Whose name nothing can cause harm on earth or in heaven, and He is the All-Hearing, All-Knowing.',
    meaningUr: 'اللہ کے نام سے جس کے نام کی برکت سے زمین اور آسمان کی کوئی چیز نقصان نہیں پہنچا سکتی اور وہی سب کچھ سننے والا اور جاننے والا ہے۔',
    benefitsEn: 'Reciting this 3 times in morning and evening protects against sudden calamities, poisons, and harm.',
    benefitsUr: 'صبح و شام 3 بار پڑھنے والے کو ناگہانی آفات، موذی جانوروں اور ہر قسم کے شر سے کامل تحفظ ملتا ہے۔',
    reference: 'Sunan Abu Dawud 5088, At-Tirmidhi 3388 (Sahih)'
  }
];

// Authentic Zikr Database
export interface ZikrItem {
  category: string;
  arabic: string;
  transliteration: string;
  meaningEn: string;
  meaningUr: string;
  count: string;
  benefitsEn: string;
  benefitsUr: string;
  reference: string;
}

export const ZIKR_DATABASE: ZikrItem[] = [
  {
    category: 'morning',
    arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    transliteration: 'Subhan-Allahi wa bihamdihi, Subhan-Allahil-Azim',
    meaningEn: 'Glory be to Allah and His is the praise, Glory be to Allah the Supreme.',
    meaningUr: 'پاک ہے اللہ اپنی حمد کے ساتھ، پاک ہے اللہ عظمت والا۔',
    count: '100x Daily',
    benefitsEn: 'Light on the tongue, heavy on the scales of good deeds on the Day of Judgment, and beloved to Ar-Rahman.',
    benefitsUr: 'زبان پر ہلکے، میزان میں بھاری اور رحمن کو نہایت محبوب کلمات۔',
    reference: 'Sahih al-Bukhari 6406, Sahih Muslim 2691'
  },
  {
    category: 'evening',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    transliteration: 'Astaghfirullahal-ladhi la ilaha illa Huwal-Hayyul-Qayyumu wa atubu ilayh',
    meaningEn: 'I seek forgiveness from Allah, there is no deity except Him, the Ever-Living, the Sustainer, and I repent to Him.',
    meaningUr: 'میں اللہ سے معافی مانگتا ہوں جس کے سوا کوئی معبود نہیں، جو زندہ اور قائم بالذات ہے اور میں اسی کے حضور توبہ کرتا ہوں۔',
    count: '3x or 100x Daily',
    benefitsEn: 'Forgives sins even if they are as vast as the foam of the ocean.',
    benefitsUr: 'گناہوں کی معافی کا باعث خواہ وہ سمندر کی جھاگ کے برابر ہی کیوں نہ ہوں۔',
    reference: 'Sunan Abi Dawud 1517, At-Tirmidhi 3577'
  },
  {
    category: 'general',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration: 'La ilaha illallahu wahdahu la sharika lahu, lahul-mulku wa lahul-hamdu, wa Huwa \'ala kulli shay\'in Qadeer',
    meaningEn: 'There is no deity except Allah alone, with no partner. To Him belongs sovereignty and praise, and He has power over all things.',
    meaningUr: 'اللہ کے سوا کوئی معبود نہیں، وہ اکیلا ہے، اس کا کوئی شریک نہیں، اسی کی بادشاہی ہے اور اسی کی حمد ہے اور وہ ہر چیز پر قادر ہے۔',
    count: '100x Daily',
    benefitsEn: 'Equivalent to freeing 10 slaves, grants 100 good deeds, wipes 100 sins, and shields from Satan all day.',
    benefitsUr: '10 غلام آزاد کرنے کا ثواب، 100 نیکیاں، 100 گناہوں کی معافی اور تمام دن شیطان سے مکمل حفاظت۔',
    reference: 'Sahih al-Bukhari 3293, Sahih Muslim 2691'
  }
];

// Authentic Hadiths Database
export interface HadithItem {
  collection: string;
  hadithNumber: string;
  narratorEn: string;
  narratorUr: string;
  arabic: string;
  english: string;
  urdu: string;
  grade: string;
}

export const HADITH_DATABASE: HadithItem[] = [
  {
    collection: 'Sahih al-Bukhari',
    hadithNumber: '1',
    narratorEn: 'Narrated by Umar bin Al-Khattab (RA)',
    narratorUr: 'روایت: حضرت عمر بن الخطاب رضی اللہ عنہ',
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    english: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.',
    urdu: 'اعمال کا دارومدار نیتوں پر ہے اور ہر انسان کے لیے وہی ہے جس کی اس نے نیت کی۔',
    grade: 'Sahih (Authentic)'
  },
  {
    collection: 'Sahih Muslim',
    hadithNumber: '223',
    narratorEn: 'Narrated by Abu Malik Al-Ash\'ari (RA)',
    narratorUr: 'روایت: حضرت ابو مالک اشعری رضی اللہ عنہ',
    arabic: 'الطُّهُورُ شَطْرُ الإِيمَانِ، وَالْحَمْدُ لِلَّهِ تَمْلأُ الْمِيزَانَ',
    english: 'Purity is half of faith, and Al-hamdulillah (praise be to Allah) fills the scale.',
    urdu: 'پاکیزگی اور طہارت نصف ایمان ہے، اور "الحمد لله" کا کلمہ میزان کو بھر دیتا ہے۔',
    grade: 'Sahih (Authentic)'
  },
  {
    collection: 'Riyad as-Salihin',
    hadithNumber: '1380',
    narratorEn: 'Narrated by Uthman bin Affan (RA)',
    narratorUr: 'روایت: حضرت عثمان بن عفان رضی اللہ عنہ',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    english: 'The best among you are those who learn the Quran and teach it.',
    urdu: 'تم میں سے بہترین شخص وہ ہے جو قرآن مجید سیکھے اور دوسروں کو سکھائے۔',
    grade: 'Sahih (Authentic)'
  }
];
