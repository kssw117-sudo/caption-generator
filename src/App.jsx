import React, { useState } from 'react';

export default function CaptionGenerator() {
  const DAILY_LIMIT = 50;
  const LIMIT_STORAGE_KEY = 'tg_daily_gens';

  function checkAndUseDailyLimit() {
    const today = new Date().toISOString().slice(0, 10);
    let record;
    try {
      record = JSON.parse(localStorage.getItem(LIMIT_STORAGE_KEY) || 'null');
    } catch (e) {
      record = null;
    }
    if (!record || record.date !== today) {
      record = { date: today, count: 0 };
    }
    if (record.count >= DAILY_LIMIT) {
      return false;
    }
    record.count += 1;
    localStorage.setItem(LIMIT_STORAGE_KEY, JSON.stringify(record));
    return true;
  }

  const [business, setBusiness] = useState('');
  const [postAbout, setPostAbout] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [history, setHistory] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [video, setVideo] = useState(null);
  const [brandVoice, setBrandVoice] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const [batchTopics, setBatchTopics] = useState('');
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [lengthMode, setLengthMode] = useState('short');
  const [results, setResults] = useState([]);
  const [translatingIndex, setTranslatingIndex] = useState(null);
  const [licenseCode, setLicenseCode] = useState(() => localStorage.getItem('tg_licenseCode') || '');
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem('tg_unlocked') === 'true');
  const [licenseError, setLicenseError] = useState('');

  const languages = [
    { code: 'ru', label: 'Русский', englishName: 'Russian', rtl: false },
    { code: 'en', label: 'English', englishName: 'English', rtl: false },
    { code: 'ar', label: 'العربية', englishName: 'Arabic', rtl: true },
    { code: 'fa', label: 'فارسی', englishName: 'Persian', rtl: true },
    { code: 'es', label: 'Español', englishName: 'Spanish', rtl: false },
    { code: 'fr', label: 'Français', englishName: 'French', rtl: false },
    { code: 'de', label: 'Deutsch', englishName: 'German', rtl: false },
    { code: 'it', label: 'Italiano', englishName: 'Italian', rtl: false },
    { code: 'pt', label: 'Português', englishName: 'Portuguese', rtl: false },
    { code: 'tr', label: 'Türkçe', englishName: 'Turkish', rtl: false },
    { code: 'zh', label: '中文', englishName: 'Chinese', rtl: false },
    { code: 'hi', label: 'हिन्दी', englishName: 'Hindi', rtl: false },
    { code: 'ja', label: '日本語', englishName: 'Japanese', rtl: false },
    { code: 'sv', label: 'Svenska', englishName: 'Swedish', rtl: false },
    { code: 'no', label: 'Norsk', englishName: 'Norwegian', rtl: false },
    { code: 'da', label: 'Dansk', englishName: 'Danish', rtl: false },
    { code: 'fi', label: 'Suomi', englishName: 'Finnish', rtl: false },
    { code: 'uk', label: 'Українська', englishName: 'Ukrainian', rtl: false },
    { code: 'be', label: 'Беларуская', englishName: 'Belarusian', rtl: false },
    { code: 'el', label: 'Ελληνικά', englishName: 'Greek', rtl: false }
  ];

  const ui = {
    ru: { title: 'Генератор подписей и хэштегов', subtitle: 'Для постов малого бизнеса в Instagram, TikTok, WhatsApp', businessLabel: 'Название бизнеса', businessPh: 'Например: кофейня «Утро»', brandVoiceLabel: 'Голос бренда', brandVoicePh: 'Например: дружелюбный, с юмором', postLabel: 'О чём пост', postPh: 'Например: новое сезонное меню с тыквенным латте', platformLabel: 'Платформа', languageLabel: 'Язык', whatsappStatus: 'WhatsApp статус', generate: 'Сгенерировать', generating: 'Генерирую', fillError: 'Заполните название бизнеса и тему поста', genError: 'Не удалось сгенерировать. Попробуйте ещё раз.', limitReached: 'Достигнут дневной лимит генераций. Попробуйте завтра.', captionsHeading: 'Варианты подписи', hashtagsHeading: 'Хэштеги', copy: 'Копировать', copied: 'Скопировано', copyAll: 'Копировать все хэштеги', preview: 'Предпросмотр', historyHeading: 'История', photoLabel: 'Фото (к нему теги)', uploadPhoto: 'Загрузить фото', changePhoto: 'Сменить фото', videoLabel: 'Видео (к нему теги)', uploadVideo: 'Загрузить видео', changeVideo: 'Сменить видео' , batchToggle: 'Пакетный режим', batchLabel: 'Темы (по одной на строку)', batchPh: 'кофе с собой\nновая коллекция\nчёрная пятница', emojiToggle: 'Эмодзи', lengthShort: 'Коротко', lengthDetailed: 'Развёрнуто', ctaHeading: 'Призыв к действию', translateTo: 'Перевести на', translateBtn: 'Перевести', licenseGateTitle: 'Введите код доступа', licensePh: 'Код доступа', unlockBtn: 'Разблокировать', licenseInvalid: 'Неверный или неактивный код', noCodeText: 'Нет кода? Купить доступ'},
    en: { title: 'Caption & hashtag generator', subtitle: 'For small business posts on Instagram, TikTok, WhatsApp', businessLabel: 'Business name', businessPh: 'e.g. Morning Coffee Shop', brandVoiceLabel: 'Brand voice', brandVoicePh: 'e.g. friendly, playful', postLabel: 'What is the post about', postPh: 'e.g. new seasonal pumpkin latte menu', platformLabel: 'Platform', languageLabel: 'Language', whatsappStatus: 'WhatsApp status', generate: 'Generate', generating: 'Generating', fillError: 'Fill in business name and post topic', genError: 'Could not generate. Try again.', limitReached: 'Daily generation limit reached. Try again tomorrow.', captionsHeading: 'Caption options', hashtagsHeading: 'Hashtags', copy: 'Copy', copied: 'Copied', copyAll: 'Copy all hashtags', preview: 'Preview', historyHeading: 'History', photoLabel: 'Photo (tags go with this)', uploadPhoto: 'Upload photo', changePhoto: 'Change photo', videoLabel: 'Video (tags go with this)', uploadVideo: 'Upload video', changeVideo: 'Change video' , batchToggle: 'Batch mode', batchLabel: 'Topics (one per line)', batchPh: 'coffee to go\nnew collection\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Short', lengthDetailed: 'Detailed', ctaHeading: 'Call to action', translateTo: 'Translate to', translateBtn: 'Translate', licenseGateTitle: 'Enter your access code', licensePh: 'Access code', unlockBtn: 'Unlock', licenseInvalid: 'Invalid or inactive code', noCodeText: 'No code? Buy access'},
    ar: { title: 'مولد التعليقات والوسوم', subtitle: 'لمنشورات الأعمال الصغيرة على إنستغرام وتيك توك وواتساب', businessLabel: 'اسم النشاط التجاري', businessPh: 'مثال: مقهى الصباح', brandVoiceLabel: 'نبرة العلامة التجارية', brandVoicePh: 'مثال: ودود ومرح', postLabel: 'موضوع المنشور', postPh: 'مثال: قائمة اليقطين الموسمية الجديدة', platformLabel: 'المنصة', languageLabel: 'اللغة', whatsappStatus: 'حالة واتساب', generate: 'إنشاء', generating: 'جارٍ الإنشاء', fillError: 'يرجى إدخال اسم النشاط وموضوع المنشور', genError: 'تعذر الإنشاء. حاول مرة أخرى.', captionsHeading: 'خيارات التعليق', hashtagsHeading: 'الوسوم', copy: 'نسخ', copied: 'تم النسخ', copyAll: 'نسخ جميع الوسوم', preview: 'معاينة', historyHeading: 'السجل', photoLabel: 'الصورة (معها الوسوم)', uploadPhoto: 'رفع صورة', changePhoto: 'تغيير الصورة', videoLabel: 'الفيديو (معه الوسوم)', uploadVideo: 'رفع فيديو', changeVideo: 'تغيير الفيديو' , batchToggle: 'الوضع الجماعي', batchLabel: 'المواضيع (كل موضوع في سطر)', batchPh: 'قهوة للطريق\nمجموعة جديدة\nالجمعة السوداء', emojiToggle: 'الرموز التعبيرية', lengthShort: 'قصير', lengthDetailed: 'مفصل', ctaHeading: 'دعوة لاتخاذ إجراء', translateTo: 'ترجمة إلى', translateBtn: 'ترجمة', licenseGateTitle: 'أدخل رمز الوصول', licensePh: 'رمز الوصول', unlockBtn: 'فتح', licenseInvalid: 'رمز غير صالح أو غير مفعّل', noCodeText: 'لا يوجد رمز؟ شراء الوصول'},
    fa: { title: 'تولیدکننده کپشن و هشتگ', subtitle: 'برای پست‌های کسب‌وکارهای کوچک در اینستاگرام، تیک‌تاک، واتساپ', businessLabel: 'نام کسب‌وکار', businessPh: 'مثال: کافه صبح', brandVoiceLabel: 'لحن برند', brandVoicePh: 'مثال: دوستانه و بازیگوش', postLabel: 'موضوع پست چیست', postPh: 'مثال: منوی فصلی جدید لاته کدو تنبل', platformLabel: 'پلتفرم', languageLabel: 'زبان', whatsappStatus: 'وضعیت واتساپ', generate: 'ایجاد', generating: 'در حال ایجاد', fillError: 'نام کسب‌وکار و موضوع پست را پر کنید', genError: 'ایجاد نشد. دوباره امتحان کنید.', captionsHeading: 'گزینه‌های کپشن', hashtagsHeading: 'هشتگ‌ها', copy: 'کپی', copied: 'کپی شد', copyAll: 'کپی همه هشتگ‌ها', preview: 'پیش‌نمایش', historyHeading: 'تاریخچه', photoLabel: 'عکس (با تگ‌ها)', uploadPhoto: 'آپلود عکس', changePhoto: 'تغییر عکس', videoLabel: 'ویدیو (با تگ‌ها)', uploadVideo: 'آپلود ویدیو', changeVideo: 'تغییر ویدیو' , batchToggle: 'حالت دسته‌ای', batchLabel: 'موضوعات (هر خط یک موضوع)', batchPh: 'قهوه بیرون‌بر\nکالکشن جدید\nبلک فرایدی', emojiToggle: 'ایموجی', lengthShort: 'کوتاه', lengthDetailed: 'مفصل', ctaHeading: 'فراخوان اقدام', translateTo: 'ترجمه به', translateBtn: 'ترجمه', licenseGateTitle: 'کد دسترسی را وارد کنید', licensePh: 'کد دسترسی', unlockBtn: 'باز کردن', licenseInvalid: 'کد نامعتبر یا غیرفعال', noCodeText: 'کد ندارید؟ خرید دسترسی'},
    es: { title: 'Generador de textos y hashtags', subtitle: 'Para publicaciones de pequeños negocios en Instagram, TikTok, WhatsApp', businessLabel: 'Nombre del negocio', businessPh: 'Ej: Cafetería Mañana', brandVoiceLabel: 'Tono de marca', brandVoicePh: 'Ej: amigable y divertido', postLabel: 'Tema de la publicación', postPh: 'Ej: nuevo menú de temporada con latte de calabaza', platformLabel: 'Plataforma', languageLabel: 'Idioma', whatsappStatus: 'Estado de WhatsApp', generate: 'Generar', generating: 'Generando', fillError: 'Completa el nombre del negocio y el tema', genError: 'No se pudo generar. Intenta de nuevo.', captionsHeading: 'Opciones de texto', hashtagsHeading: 'Hashtags', copy: 'Copiar', copied: 'Copiado', copyAll: 'Copiar todos los hashtags', preview: 'Vista previa', historyHeading: 'Historial', photoLabel: 'Foto (con estas etiquetas)', uploadPhoto: 'Subir foto', changePhoto: 'Cambiar foto', videoLabel: 'Video (con estas etiquetas)', uploadVideo: 'Subir video', changeVideo: 'Cambiar video' , batchToggle: 'Modo por lotes', batchLabel: 'Temas (uno por línea)', batchPh: 'café para llevar\nnueva colección\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Corto', lengthDetailed: 'Detallado', ctaHeading: 'Llamada a la acción', translateTo: 'Traducir a', translateBtn: 'Traducir', licenseGateTitle: 'Introduce tu código de acceso', licensePh: 'Código de acceso', unlockBtn: 'Desbloquear', licenseInvalid: 'Código inválido o inactivo', noCodeText: '¿Sin código? Comprar acceso'},
    fr: { title: 'Générateur de légendes et hashtags', subtitle: 'Pour les publications de petites entreprises sur Instagram, TikTok, WhatsApp', businessLabel: 'Nom de l\'entreprise', businessPh: 'Ex : Café du Matin', brandVoiceLabel: 'Ton de la marque', brandVoicePh: 'Ex : amical et enjoué', postLabel: 'Sujet de la publication', postPh: 'Ex : nouveau menu de saison au latte citrouille', platformLabel: 'Plateforme', languageLabel: 'Langue', whatsappStatus: 'Statut WhatsApp', generate: 'Générer', generating: 'Génération', fillError: 'Remplissez le nom de l\'entreprise et le sujet', genError: 'Échec de la génération. Réessayez.', captionsHeading: 'Options de légende', hashtagsHeading: 'Hashtags', copy: 'Copier', copied: 'Copié', copyAll: 'Copier tous les hashtags', preview: 'Aperçu', historyHeading: 'Historique', photoLabel: 'Photo (avec ces hashtags)', uploadPhoto: 'Ajouter une photo', changePhoto: 'Changer la photo', videoLabel: 'Vidéo (avec ces hashtags)', uploadVideo: 'Ajouter une vidéo', changeVideo: 'Changer la vidéo' , batchToggle: 'Mode par lots', batchLabel: 'Sujets (un par ligne)', batchPh: 'café à emporter\nnouvelle collection\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Court', lengthDetailed: 'Détaillé', ctaHeading: 'Appel à l\'action', translateTo: 'Traduire en', translateBtn: 'Traduire', licenseGateTitle: 'Entrez votre code d\'accès', licensePh: 'Code d\'accès', unlockBtn: 'Déverrouiller', licenseInvalid: 'Code invalide ou inactif', noCodeText: 'Pas de code ? Acheter lʼaccès'},
    de: { title: 'Bildunterschriften- und Hashtag-Generator', subtitle: 'Für Beiträge kleiner Unternehmen auf Instagram, TikTok, WhatsApp', businessLabel: 'Firmenname', businessPh: 'z.B. Café Morgen', brandVoiceLabel: 'Markenstimme', brandVoicePh: 'z.B. freundlich, verspielt', postLabel: 'Worum geht es im Beitrag', postPh: 'z.B. neues saisonales Kürbis-Latte-Menü', platformLabel: 'Plattform', languageLabel: 'Sprache', whatsappStatus: 'WhatsApp-Status', generate: 'Generieren', generating: 'Generiere', fillError: 'Firmenname und Thema ausfüllen', genError: 'Generierung fehlgeschlagen. Erneut versuchen.', captionsHeading: 'Textvorschläge', hashtagsHeading: 'Hashtags', copy: 'Kopieren', copied: 'Kopiert', copyAll: 'Alle Hashtags kopieren', preview: 'Vorschau', historyHeading: 'Verlauf', photoLabel: 'Foto (dazu die Hashtags)', uploadPhoto: 'Foto hochladen', changePhoto: 'Foto ändern', videoLabel: 'Video (dazu die Hashtags)', uploadVideo: 'Video hochladen', changeVideo: 'Video ändern' , batchToggle: 'Stapelmodus', batchLabel: 'Themen (eins pro Zeile)', batchPh: 'Kaffee zum Mitnehmen\nneue Kollektion\nBlack Friday', emojiToggle: 'Emoji', lengthShort: 'Kurz', lengthDetailed: 'Ausführlich', ctaHeading: 'Handlungsaufforderung', translateTo: 'Übersetzen nach', translateBtn: 'Übersetzen', licenseGateTitle: 'Zugangscode eingeben', licensePh: 'Zugangscode', unlockBtn: 'Entsperren', licenseInvalid: 'Ungültiger oder inaktiver Code', noCodeText: 'Kein Code? Zugang kaufen'},
    it: { title: 'Generatore di didascalie e hashtag', subtitle: 'Per post di piccole attività su Instagram, TikTok, WhatsApp', businessLabel: 'Nome attività', businessPh: 'Es: Caffetteria Mattino', brandVoiceLabel: 'Tono del brand', brandVoicePh: 'Es: amichevole e giocoso', postLabel: 'Argomento del post', postPh: 'Es: nuovo menu stagionale con latte alla zucca', platformLabel: 'Piattaforma', languageLabel: 'Lingua', whatsappStatus: 'Stato WhatsApp', generate: 'Genera', generating: 'Generazione', fillError: 'Inserisci nome attività e argomento', genError: 'Generazione non riuscita. Riprova.', captionsHeading: 'Opzioni didascalia', hashtagsHeading: 'Hashtag', copy: 'Copia', copied: 'Copiato', copyAll: 'Copia tutti gli hashtag', preview: 'Anteprima', historyHeading: 'Cronologia', photoLabel: 'Foto (con questi hashtag)', uploadPhoto: 'Carica foto', changePhoto: 'Cambia foto', videoLabel: 'Video (con questi hashtag)', uploadVideo: 'Carica video', changeVideo: 'Cambia video' , batchToggle: 'Modalità batch', batchLabel: 'Argomenti (uno per riga)', batchPh: 'caffè da asporto\nnuova collezione\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Breve', lengthDetailed: 'Dettagliato', ctaHeading: 'Invito all\'azione', translateTo: 'Traduci in', translateBtn: 'Traduci', licenseGateTitle: 'Inserisci il codice di accesso', licensePh: 'Codice di accesso', unlockBtn: 'Sblocca', licenseInvalid: 'Codice non valido o inattivo', noCodeText: 'Nessun codice? Acquista lʼaccesso'},
    pt: { title: 'Gerador de legendas e hashtags', subtitle: 'Para posts de pequenos negócios no Instagram, TikTok, WhatsApp', businessLabel: 'Nome do negócio', businessPh: 'Ex: Cafeteria Manhã', brandVoiceLabel: 'Tom da marca', brandVoicePh: 'Ex: amigável e divertido', postLabel: 'Sobre o que é o post', postPh: 'Ex: novo cardápio sazonal de latte de abóbora', platformLabel: 'Plataforma', languageLabel: 'Idioma', whatsappStatus: 'Status do WhatsApp', generate: 'Gerar', generating: 'Gerando', fillError: 'Preencha o nome do negócio e o tema', genError: 'Não foi possível gerar. Tente novamente.', captionsHeading: 'Opções de legenda', hashtagsHeading: 'Hashtags', copy: 'Copiar', copied: 'Copiado', copyAll: 'Copiar todas as hashtags', preview: 'Pré-visualização', historyHeading: 'Histórico', photoLabel: 'Foto (com estas hashtags)', uploadPhoto: 'Carregar foto', changePhoto: 'Alterar foto', videoLabel: 'Vídeo (com estas hashtags)', uploadVideo: 'Carregar vídeo', changeVideo: 'Alterar vídeo' , batchToggle: 'Modo em lote', batchLabel: 'Temas (um por linha)', batchPh: 'café para levar\nnova coleção\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Curto', lengthDetailed: 'Detalhado', ctaHeading: 'Chamada para ação', translateTo: 'Traduzir para', translateBtn: 'Traduzir', licenseGateTitle: 'Insira seu código de acesso', licensePh: 'Código de acesso', unlockBtn: 'Desbloquear', licenseInvalid: 'Código inválido ou inativo', noCodeText: 'Sem código? Comprar acesso'},
    tr: { title: 'Başlık ve hashtag üretici', subtitle: 'Instagram, TikTok, WhatsApp için küçük işletme gönderileri', businessLabel: 'İşletme adı', businessPh: 'Örn: Sabah Kahve Dükkanı', brandVoiceLabel: 'Marka tonu', brandVoicePh: 'Örn: samimi ve eğlenceli', postLabel: 'Gönderi konusu', postPh: 'Örn: yeni sezonluk balkabaklı latte menüsü', platformLabel: 'Platform', languageLabel: 'Dil', whatsappStatus: 'WhatsApp durumu', generate: 'Oluştur', generating: 'Oluşturuluyor', fillError: 'İşletme adı ve konuyu doldurun', genError: 'Oluşturulamadı. Tekrar deneyin.', captionsHeading: 'Başlık seçenekleri', hashtagsHeading: 'Hashtagler', copy: 'Kopyala', copied: 'Kopyalandı', copyAll: 'Tüm hashtagleri kopyala', preview: 'Önizleme', historyHeading: 'Geçmiş', photoLabel: 'Fotoğraf (bu etiketlerle)', uploadPhoto: 'Fotoğraf yükle', changePhoto: 'Fotoğrafı değiştir', videoLabel: 'Video (bu etiketlerle)', uploadVideo: 'Video yükle', changeVideo: 'Videoyu değiştir' , batchToggle: 'Toplu mod', batchLabel: 'Konular (satır başına bir)', batchPh: 'yanında kahve\nyeni koleksiyon\nkara cuma', emojiToggle: 'Emoji', lengthShort: 'Kısa', lengthDetailed: 'Detaylı', ctaHeading: 'Eylem çağrısı', translateTo: 'Şuna çevir', translateBtn: 'Çevir', licenseGateTitle: 'Erişim kodunuzu girin', licensePh: 'Erişim kodu', unlockBtn: 'Kilidi aç', licenseInvalid: 'Geçersiz veya etkin olmayan kod', noCodeText: 'Kodunuz yok mu? Erişim satın alın'},
    zh: { title: '文案和标签生成器', subtitle: '适用于Instagram、TikTok、WhatsApp的小企业帖子', businessLabel: '企业名称', businessPh: '例如：晨光咖啡馆', brandVoiceLabel: '品牌语气', brandVoicePh: '例如：友好、活泼', postLabel: '帖子主题', postPh: '例如：新款南瓜拿铁季节菜单', platformLabel: '平台', languageLabel: '语言', whatsappStatus: 'WhatsApp状态', generate: '生成', generating: '生成中', fillError: '请填写企业名称和帖子主题', genError: '生成失败，请重试。', captionsHeading: '文案选项', hashtagsHeading: '标签', copy: '复制', copied: '已复制', copyAll: '复制所有标签', preview: '预览', historyHeading: '历史记录', photoLabel: '照片（配这些标签）', uploadPhoto: '上传照片', changePhoto: '更换照片', videoLabel: '视频（配这些标签）', uploadVideo: '上传视频', changeVideo: '更换视频' , batchToggle: '批量模式', batchLabel: '主题（每行一个）', batchPh: '外带咖啡\n新系列\n黑色星期五', emojiToggle: '表情符号', lengthShort: '简短', lengthDetailed: '详细', ctaHeading: '行动号召', translateTo: '翻译成', translateBtn: '翻译', licenseGateTitle: '输入访问码', licensePh: '访问码', unlockBtn: '解锁', licenseInvalid: '无效或未激活的代码', noCodeText: '没有代码？购买访问权限'},
    hi: { title: 'कैप्शन और हैशटैग जनरेटर', subtitle: 'इंस्टाग्राम, टिकटॉक, व्हाट्सएप पर छोटे व्यवसायों के लिए', businessLabel: 'व्यवसाय का नाम', businessPh: 'उदा: मॉर्निंग कॉफी शॉप', brandVoiceLabel: 'ब्रांड वॉइस', brandVoicePh: 'उदा: दोस्ताना और मज़ेदार', postLabel: 'पोस्ट किस बारे में है', postPh: 'उदा: नया सीजनल पम्पकिन लट्टे मेन्यू', platformLabel: 'प्लेटफ़ॉर्म', languageLabel: 'भाषा', whatsappStatus: 'व्हाट्सएप स्टेटस', generate: 'जनरेट करें', generating: 'जनरेट हो रहा है', fillError: 'व्यवसाय का नाम और विषय भरें', genError: 'जनरेट नहीं हो सका। फिर से प्रयास करें।', captionsHeading: 'कैप्शन विकल्प', hashtagsHeading: 'हैशटैग', copy: 'कॉपी करें', copied: 'कॉपी हो गया', copyAll: 'सभी हैशटैग कॉपी करें', preview: 'पूर्वावलोकन', historyHeading: 'इतिहास', photoLabel: 'फोटो (इन टैग्स के साथ)', uploadPhoto: 'फोटो अपलोड करें', changePhoto: 'फोटो बदलें', videoLabel: 'वीडियो (इन टैग्स के साथ)', uploadVideo: 'वीडियो अपलोड करें', changeVideo: 'वीडियो बदलें' , batchToggle: 'बैच मोड', batchLabel: 'विषय (प्रति पंक्ति एक)', batchPh: 'कॉफी टू-गो\nनया कलेक्शन\nब्लैक फ्राइडे', emojiToggle: 'इमोजी', lengthShort: 'छोटा', lengthDetailed: 'विस्तृत', ctaHeading: 'कॉल टू एक्शन', translateTo: 'अनुवाद करें भाषा', translateBtn: 'अनुवाद करें', licenseGateTitle: 'अपना एक्सेस कोड डालें', licensePh: 'एक्सेस कोड', unlockBtn: 'अनलॉक करें', licenseInvalid: 'अमान्य या निष्क्रिय कोड', noCodeText: 'कोड नहीं है? एक्सेस खरीदें'},
    ja: { title: 'キャプション&ハッシュタグ生成', subtitle: 'Instagram、TikTok、WhatsAppの小規模ビジネス投稿向け', businessLabel: 'ビジネス名', businessPh: '例：モーニングコーヒーショップ', brandVoiceLabel: 'ブランドトーン', brandVoicePh: '例：親しみやすく明るい', postLabel: '投稿の内容', postPh: '例：新しい季節のパンプキンラテメニュー', platformLabel: 'プラットフォーム', languageLabel: '言語', whatsappStatus: 'WhatsAppステータス', generate: '生成', generating: '生成中', fillError: 'ビジネス名と投稿内容を入力してください', genError: '生成できませんでした。もう一度お試しください。', captionsHeading: 'キャプション候補', hashtagsHeading: 'ハッシュタグ', copy: 'コピー', copied: 'コピーしました', copyAll: 'すべてのハッシュタグをコピー', preview: 'プレビュー', historyHeading: '履歴', photoLabel: '写真（このタグ付き）', uploadPhoto: '写真をアップロード', changePhoto: '写真を変更', videoLabel: '動画（このタグ付き）', uploadVideo: '動画をアップロード', changeVideo: '動画を変更' , batchToggle: '一括モード', batchLabel: 'トピック（1行に1つ）', batchPh: 'テイクアウトコーヒー\n新コレクション\nブラックフライデー', emojiToggle: '絵文字', lengthShort: '短め', lengthDetailed: '詳細', ctaHeading: '行動喚起', translateTo: '翻訳先', translateBtn: '翻訳', licenseGateTitle: 'アクセスコードを入力', licensePh: 'アクセスコード', unlockBtn: '解除', licenseInvalid: '無効または無効化されたコード', noCodeText: 'コードがない場合はこちら'},
    sv: { title: 'Bildtext- och hashtaggenerator', subtitle: 'För småföretags inlägg på Instagram, TikTok, WhatsApp', businessLabel: 'Företagsnamn', businessPh: 'T.ex: Morgon Kaffehus', brandVoiceLabel: 'Varumärkesröst', brandVoicePh: 'T.ex: vänlig och lekfull', postLabel: 'Vad handlar inlägget om', postPh: 'T.ex: ny säsongsmeny med pumpalatte', platformLabel: 'Plattform', languageLabel: 'Språk', whatsappStatus: 'WhatsApp-status', generate: 'Generera', generating: 'Genererar', fillError: 'Fyll i företagsnamn och ämne', genError: 'Kunde inte generera. Försök igen.', captionsHeading: 'Bildtextalternativ', hashtagsHeading: 'Hashtaggar', copy: 'Kopiera', copied: 'Kopierat', copyAll: 'Kopiera alla hashtaggar', preview: 'Förhandsgranskning', historyHeading: 'Historik', photoLabel: 'Foto (med dessa hashtaggar)', uploadPhoto: 'Ladda upp foto', changePhoto: 'Byt foto', videoLabel: 'Video (med dessa hashtaggar)', uploadVideo: 'Ladda upp video', changeVideo: 'Byt video' , batchToggle: 'Batch-läge', batchLabel: 'Ämnen (ett per rad)', batchPh: 'kaffe att gå\nny kollektion\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Kort', lengthDetailed: 'Utförlig', ctaHeading: 'Uppmaning till handling', translateTo: 'Översätt till', translateBtn: 'Översätt', licenseGateTitle: 'Ange din åtkomstkod', licensePh: 'Åtkomstkod', unlockBtn: 'Lås upp', licenseInvalid: 'Ogiltig eller inaktiv kod', noCodeText: 'Ingen kod? Köp åtkomst'},
    no: { title: 'Bildetekst- og emneknagg-generator', subtitle: 'For små bedrifters innlegg på Instagram, TikTok, WhatsApp', businessLabel: 'Bedriftsnavn', businessPh: 'F.eks: Morgen Kaffebar', brandVoiceLabel: 'Merkevarestemme', brandVoicePh: 'F.eks: vennlig og leken', postLabel: 'Hva handler innlegget om', postPh: 'F.eks: ny sesongmeny med gresskarlatte', platformLabel: 'Plattform', languageLabel: 'Språk', whatsappStatus: 'WhatsApp-status', generate: 'Generer', generating: 'Genererer', fillError: 'Fyll inn bedriftsnavn og tema', genError: 'Kunne ikke generere. Prøv igjen.', captionsHeading: 'Bildetekstalternativer', hashtagsHeading: 'Emneknagger', copy: 'Kopier', copied: 'Kopiert', copyAll: 'Kopier alle emneknagger', preview: 'Forhåndsvisning', historyHeading: 'Historikk', photoLabel: 'Bilde (med disse emneknaggene)', uploadPhoto: 'Last opp bilde', changePhoto: 'Bytt bilde', videoLabel: 'Video (med disse emneknaggene)', uploadVideo: 'Last opp video', changeVideo: 'Bytt video' , batchToggle: 'Batch-modus', batchLabel: 'Emner (ett per linje)', batchPh: 'kaffe å gå\nny kolleksjon\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Kort', lengthDetailed: 'Utførlig', ctaHeading: 'Oppfordring til handling', translateTo: 'Oversett til', translateBtn: 'Oversett', licenseGateTitle: 'Angi tilgangskoden din', licensePh: 'Tilgangskode', unlockBtn: 'Lås opp', licenseInvalid: 'Ugyldig eller inaktiv kode', noCodeText: 'Ingen kode? Kjøp tilgang'},
    da: { title: 'Billedtekst- og hashtag-generator', subtitle: 'Til små virksomheders opslag på Instagram, TikTok, WhatsApp', businessLabel: 'Virksomhedsnavn', businessPh: 'F.eks: Morgen Kaffebar', brandVoiceLabel: 'Brandstemme', brandVoicePh: 'F.eks: venlig og legesyg', postLabel: 'Hvad handler opslaget om', postPh: 'F.eks: ny sæsonmenu med græskarlatte', platformLabel: 'Platform', languageLabel: 'Sprog', whatsappStatus: 'WhatsApp-status', generate: 'Generer', generating: 'Genererer', fillError: 'Udfyld virksomhedsnavn og emne', genError: 'Kunne ikke generere. Prøv igen.', captionsHeading: 'Billedtekstmuligheder', hashtagsHeading: 'Hashtags', copy: 'Kopier', copied: 'Kopieret', copyAll: 'Kopier alle hashtags', preview: 'Forhåndsvisning', historyHeading: 'Historik', photoLabel: 'Foto (med disse hashtags)', uploadPhoto: 'Upload foto', changePhoto: 'Skift foto', videoLabel: 'Video (med disse hashtags)', uploadVideo: 'Upload video', changeVideo: 'Skift video' , batchToggle: 'Batch-tilstand', batchLabel: 'Emner (et per linje)', batchPh: 'kaffe to go\nny kollektion\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Kort', lengthDetailed: 'Uddybet', ctaHeading: 'Opfordring til handling', translateTo: 'Oversæt til', translateBtn: 'Oversæt', licenseGateTitle: 'Indtast din adgangskode', licensePh: 'Adgangskode', unlockBtn: 'Lås op', licenseInvalid: 'Ugyldig eller inaktiv kode', noCodeText: 'Ingen kode? Køb adgang'},
    fi: { title: 'Kuvateksti- ja hashtag-generaattori', subtitle: 'Pienyritysten Instagram-, TikTok- ja WhatsApp-julkaisuihin', businessLabel: 'Yrityksen nimi', businessPh: 'Esim: Aamu Kahvila', brandVoiceLabel: 'Brändin sävy', brandVoicePh: 'Esim: ystävällinen ja leikkisä', postLabel: 'Mistä julkaisu kertoo', postPh: 'Esim: uusi kausiluontoinen kurpitsalattemenu', platformLabel: 'Alusta', languageLabel: 'Kieli', whatsappStatus: 'WhatsApp-tila', generate: 'Luo', generating: 'Luodaan', fillError: 'Täytä yrityksen nimi ja aihe', genError: 'Luonti epäonnistui. Yritä uudelleen.', captionsHeading: 'Kuvatekstivaihtoehdot', hashtagsHeading: 'Hashtagit', copy: 'Kopioi', copied: 'Kopioitu', copyAll: 'Kopioi kaikki hashtagit', preview: 'Esikatselu', historyHeading: 'Historia', photoLabel: 'Kuva (näillä hashtageilla)', uploadPhoto: 'Lataa kuva', changePhoto: 'Vaihda kuva', videoLabel: 'Video (näillä hashtageilla)', uploadVideo: 'Lataa video', changeVideo: 'Vaihda video' , batchToggle: 'Erätila', batchLabel: 'Aiheet (yksi per rivi)', batchPh: 'kahvi mukaan\nuusi mallisto\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Lyhyt', lengthDetailed: 'Yksityiskohtainen', ctaHeading: 'Toimintakehotus', translateTo: 'Käännä kielelle', translateBtn: 'Käännä', licenseGateTitle: 'Anna käyttöoikeuskoodisi', licensePh: 'Käyttöoikeuskoodi', unlockBtn: 'Avaa lukitus', licenseInvalid: 'Virheellinen tai passiivinen koodi', noCodeText: 'Ei koodia? Osta käyttöoikeus'},
    uk: { title: 'Генератор підписів і хештегів', subtitle: 'Для постів малого бізнесу в Instagram, TikTok, WhatsApp', businessLabel: 'Назва бізнесу', businessPh: 'Наприклад: кав\'ярня «Ранок»', brandVoiceLabel: 'Голос бренду', brandVoicePh: 'Наприклад: дружній, з гумором', postLabel: 'Про що пост', postPh: 'Наприклад: нове сезонне меню з гарбузовим лате', platformLabel: 'Платформа', languageLabel: 'Мова', whatsappStatus: 'Статус WhatsApp', generate: 'Згенерувати', generating: 'Генерую', fillError: 'Заповніть назву бізнесу і тему поста', genError: 'Не вдалося згенерувати. Спробуйте ще раз.', captionsHeading: 'Варіанти підпису', hashtagsHeading: 'Хештеги', copy: 'Копіювати', copied: 'Скопійовано', copyAll: 'Копіювати всі хештеги', preview: 'Попередній перегляд', historyHeading: 'Історія', photoLabel: 'Фото (з цими хештегами)', uploadPhoto: 'Завантажити фото', changePhoto: 'Змінити фото', videoLabel: 'Відео (з цими хештегами)', uploadVideo: 'Завантажити відео', changeVideo: 'Змінити відео' , batchToggle: 'Пакетний режим', batchLabel: 'Теми (по одній на рядок)', batchPh: 'кава з собою\nнова колекція\nчорна пʼятниця', emojiToggle: 'Емодзі', lengthShort: 'Коротко', lengthDetailed: 'Розгорнуто', ctaHeading: 'Заклик до дії', translateTo: 'Перекласти на', translateBtn: 'Перекласти', licenseGateTitle: 'Введіть код доступу', licensePh: 'Код доступу', unlockBtn: 'Розблокувати', licenseInvalid: 'Невірний або неактивний код', noCodeText: 'Немає коду? Купити доступ'},
    be: { title: 'Генератар подпісаў і хэштэгаў', subtitle: 'Для паставо малога бізнесу ў Instagram, TikTok, WhatsApp', businessLabel: 'Назва бізнесу', businessPh: 'Напрыклад: кавярня «Раніца»', brandVoiceLabel: 'Голас брэнда', brandVoicePh: 'Напрыклад: сяброўскі, з гумарам', postLabel: 'Пра што пост', postPh: 'Напрыклад: новае сезоннае меню з гарбузовым лятэ', platformLabel: 'Платформа', languageLabel: 'Мова', whatsappStatus: 'Статус WhatsApp', generate: 'Згенераваць', generating: 'Генерую', fillError: 'Запоўніце назву бізнесу і тэму поста', genError: 'Не атрымалася згенераваць. Паспрабуйце яшчэ раз.', captionsHeading: 'Варыянты подпісу', hashtagsHeading: 'Хэштэгі', copy: 'Капіяваць', copied: 'Скапіявана', copyAll: 'Капіяваць усе хэштэгі', preview: 'Папярэдні прагляд', historyHeading: 'Гісторыя', photoLabel: 'Фота (з гэтымі хэштэгамі)', uploadPhoto: 'Загрузіць фота', changePhoto: 'Змяніць фота', videoLabel: 'Відэа (з гэтымі хэштэгамі)', uploadVideo: 'Загрузіць відэа', changeVideo: 'Змяніць відэа' , batchToggle: 'Пакетны рэжым', batchLabel: 'Тэмы (па адной на радок)', batchPh: 'кава з сабой\nновая калекцыя\nчорная пятніца', emojiToggle: 'Эмодзі', lengthShort: 'Коратка', lengthDetailed: 'Разгорнута', ctaHeading: 'Заклік да дзеяння', translateTo: 'Перакласці на', translateBtn: 'Перакласці', licenseGateTitle: 'Увядзіце код доступу', licensePh: 'Код доступу', unlockBtn: 'Разблакаваць', licenseInvalid: 'Няправільны або неактыўны код', noCodeText: 'Няма кода? Купіць доступ'},
    el: { title: 'Δημιουργός λεζάντας και hashtag', subtitle: 'Για αναρτήσεις μικρών επιχειρήσεων στο Instagram, TikTok, WhatsApp', businessLabel: 'Όνομα επιχείρησης', businessPh: 'Π.χ. Καφετέρια Πρωί', brandVoiceLabel: 'Τόνος επωνυμίας', brandVoicePh: 'Π.χ. φιλικός και παιχνιδιάρικος', postLabel: 'Ποιο είναι το θέμα της ανάρτησης', postPh: 'Π.χ. νέο εποχιακό μενού με latte κολοκύθας', platformLabel: 'Πλατφόρμα', languageLabel: 'Γλώσσα', whatsappStatus: 'Κατάσταση WhatsApp', generate: 'Δημιουργία', generating: 'Δημιουργία σε εξέλιξη', fillError: 'Συμπληρώστε το όνομα της επιχείρησης και το θέμα', genError: 'Αποτυχία δημιουργίας. Δοκιμάστε ξανά.', captionsHeading: 'Επιλογές λεζάντας', hashtagsHeading: 'Hashtags', copy: 'Αντιγραφή', copied: 'Αντιγράφηκε', copyAll: 'Αντιγραφή όλων των hashtags', preview: 'Προεπισκόπηση', historyHeading: 'Ιστορικό', photoLabel: 'Φωτογραφία (με αυτά τα hashtags)', uploadPhoto: 'Μεταφόρτωση φωτογραφίας', changePhoto: 'Αλλαγή φωτογραφίας', videoLabel: 'Βίντεο (με αυτά τα hashtags)', uploadVideo: 'Μεταφόρτωση βίντεο', changeVideo: 'Αλλαγή βίντεο' , batchToggle: 'Λειτουργία παρτίδας', batchLabel: 'Θέματα (ένα ανά γραμμή)', batchPh: 'καφές για το δρόμο\nνέα συλλογή\nblack friday', emojiToggle: 'Emoji', lengthShort: 'Σύντομο', lengthDetailed: 'Αναλυτικό', ctaHeading: 'Κάλεσμα σε δράση', translateTo: 'Μετάφραση σε', translateBtn: 'Μετάφραση', licenseGateTitle: 'Εισαγάγετε τον κωδικό πρόσβασης', licensePh: 'Κωδικός πρόσβασης', unlockBtn: 'Ξεκλείδωμα', licenseInvalid: 'Μη έγκυρος ή ανενεργός κωδικός', noCodeText: 'Δεν έχετε κωδικό; Αγοράστε πρόσβαση'}
  };

  const currentLang = languages.find(l => l.code === language) || languages[0];
  const t = ui[language] || ui.ru;

  const platformNames = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    whatsapp: 'WhatsApp status',
    youtube: 'YouTube Shorts',
    twitter: 'Twitter / X',
    pinterest: 'Pinterest'
  };
  const platformLimits = {
    instagram: 2200,
    tiktok: 2200,
    whatsapp: 700,
    youtube: 1000,
    twitter: 280,
    pinterest: 500
  };

  async function generateOne(topic) {
    if (!checkAndUseDailyLimit()) {
      throw new Error('limit');
    }
    const platformName = platformNames[platform] || 'Instagram';
    const langInstruction = currentLang.englishName;
    const voiceInstruction = brandVoice.trim()
      ? `Match this brand voice/tone: "${brandVoice.trim()}".`
      : `Use a friendly, casual small-business tone.`;
    const emojiInstruction = includeEmoji ? 'Include one relevant emoji in each caption.' : 'Do not include any emojis.';
    const lengthInstruction = lengthMode === 'short' ? 'Keep each caption short, 1-2 sentences.' : 'Write more detailed captions, 3-5 sentences.';

    const prompt = `You are a social media copywriter for small businesses. Business: "${business}". Post topic: "${topic}". Platform: ${platformName}. Write in ${langInstruction}. ${voiceInstruction} ${emojiInstruction} ${lengthInstruction}

Respond ONLY with valid JSON, no markdown, no code fences, in this exact shape:
{"captions": ["caption option 1", "caption option 2", "caption option 3"], "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"], "cta": "one short call-to-action line"}

Captions must stay under ${platformLimits[platform] || 2200} characters. Hashtags should be relevant to the business niche and platform, without the # symbol, lowercase, no spaces. The call-to-action line should be short and platform-appropriate (e.g. "Order via WhatsApp" style).`;

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseCode, prompt })
    });

    if (response.status === 403) {
      throw new Error('license');
    }

    const data = await response.json();
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      business,
      topic,
      captions: parsed.captions,
      hashtags: parsed.hashtags,
      cta: parsed.cta || '',
      activeCaption: 0,
      translations: {},
      activeLang: null
    };
  }

  async function handleGenerate() {
    const topics = batchMode
      ? batchTopics.split('\n').map(s => s.trim()).filter(Boolean)
      : [postAbout.trim()];

    if (!business.trim() || topics.length === 0) {
      setError(t.fillError);
      return;
    }

    setError('');
    setLoading(true);
    setResults([]);

    const collected = [];
    try {
      for (const topic of topics) {
        const item = await generateOne(topic);
        collected.push(item);
        setResults([...collected]);
      }
      setHistory(prev => [{ business, platform, results: collected }, ...prev].slice(0, 5));
    } catch (err) {
      if (err.message === 'license') {
        setUnlocked(false);
        setLicenseError(t.licenseInvalid);
      } else if (err.message === 'limit') {
        setError(t.limitReached || 'Daily generation limit reached. Try again tomorrow.');
      } else {
        setError(t.genError);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleTranslate(index, targetLangCode) {
    const item = results[index];
    if (!item) return;
    const targetLang = languages.find(l => l.code === targetLangCode);
    if (!targetLang) return;

    if (!checkAndUseDailyLimit()) {
      setError(t.limitReached || 'Daily generation limit reached. Try again tomorrow.');
      return;
    }

    setTranslatingIndex(index);
    const prompt = `Translate the following social media captions, hashtags, and call-to-action into ${targetLang.englishName}, keeping the same tone and meaning. Respond ONLY with valid JSON, no markdown: {"captions": ["...", "...", "..."], "hashtags": ["...", ...], "cta": "..."}

Captions: ${JSON.stringify(item.captions)}
Hashtags: ${JSON.stringify(item.hashtags)}
CTA: ${JSON.stringify(item.cta)}`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseCode, prompt })
      });
      const data = await response.json();
      const text = data.content.map(b => b.text || '').join('');
      const clean = text.replace(/```json|```/g, '').trim();
      const translated = JSON.parse(clean);

      setResults(prev => prev.map((r, i) => i === index
        ? { ...r, translations: { ...r.translations, [targetLangCode]: translated }, activeLang: targetLangCode }
        : r
      ));
    } catch (err) {
      setError(t.genError);
    } finally {
      setTranslatingIndex(null);
    }
  }

  function setActiveLang(index, langCode) {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, activeLang: langCode } : r));
  }

  function setResultActiveCaption(index, capIndex) {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, activeCaption: capIndex } : r));
  }

  function handleCopy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  }

  function loadFromHistory(item) {
    setBusiness(item.business);
    setPlatform(item.platform);
    setResults(item.results);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function handleVideoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setVideo(URL.createObjectURL(file));
  }

  // Проверка кода: коды AppSumo начинаются с "TAG-" и проверяются через
  // /api/redeem-appsumo (уникальный код на покупателя, отмечается как
  // использованный). Обычные коды (Getly, TAG92) работают как раньше.
  async function handleUnlock() {
    if (!licenseCode.trim()) return;
    setLicenseError('');

    if (licenseCode.trim().toUpperCase().startsWith('TAG-')) {
      try {
        const res = await fetch('/api/redeem-appsumo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: licenseCode.trim() })
        });
        const data = await res.json();
        if (data.success) {
          setUnlocked(true);
          localStorage.setItem('tg_unlocked', 'true');
          localStorage.setItem('tg_licenseCode', licenseCode.trim());
        } else {
          setLicenseError(data.error || t.licenseInvalid);
        }
      } catch (err) {
        setLicenseError(t.licenseInvalid);
      }
      return;
    }

    setUnlocked(true);
    localStorage.setItem('tg_unlocked', 'true');
    localStorage.setItem('tg_licenseCode', licenseCode.trim());
  }

  const headingFont = currentLang.rtl ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" : "'Fraunces', serif";
  const bodyFont = currentLang.rtl ? "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif" : 'inherit';

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir={currentLang.rtl ? 'rtl' : 'ltr'} style={{ background: '#F5F4EE', fontFamily: bodyFont }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Cairo:wght@400;700&display=swap');`}</style>
        <div className="w-full max-w-sm rounded-xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E4E1D6' }}>
          <div className="flex justify-end mb-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs rounded-lg px-2 py-1 focus:outline-none"
              style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#6B6659' }}
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </div>
          <h1
            className="text-2xl mb-4 flex items-center gap-2"
            style={{ fontFamily: headingFont }}
          >
            <span style={{ display: 'inline-block', transform: 'skewX(-12deg)', fontFamily: 'sans-serif', fontWeight: 800, background: 'linear-gradient(90deg, #D97757, #BD5D3A)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>#</span>
            <span style={{ background: 'linear-gradient(90deg, #D97757, #BD5D3A)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t.licenseGateTitle}</span>
          </h1>
          <input
            type="text"
            value={licenseCode}
            onChange={(e) => setLicenseCode(e.target.value)}
            placeholder={t.licensePh}
            className="w-full rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none"
            style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
          />
          {licenseError && <p className="text-sm mb-3" style={{ color: '#B34B3C' }}>{licenseError}</p>}
          <button
            onClick={handleUnlock}
            className="w-full font-medium py-2.5 rounded-lg text-sm"
            style={{ background: 'linear-gradient(90deg, #D97757, #BD5D3A)', color: '#F5F4EE' }}
          >
            {t.unlockBtn}
          </button>
          <a
            href="/buy.html"
            className="block text-center text-xs mt-4"
            style={{ color: '#A56A45' }}
          >
            {t.noCodeText}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 relative overflow-hidden" dir={currentLang.rtl ? 'rtl' : 'ltr'} style={{ background: '#F5F4EE', fontFamily: bodyFont }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Cairo:wght@400;700&display=swap');
        @keyframes floatBlob { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px,-24px) scale(1.08); } }
        @keyframes pulseDot { 0%, 80%, 100% { opacity: 0.25; transform: scale(0.7); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="absolute rounded-full pointer-events-none" style={{ width: 340, height: 340, background: '#D97757', filter: 'blur(90px)', opacity: 0.12, top: -100, left: -80, animation: 'floatBlob 14s ease-in-out infinite' }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 300, height: 300, background: '#BD5D3A', filter: 'blur(90px)', opacity: 0.14, bottom: -80, right: -60, animation: 'floatBlob 16s ease-in-out infinite', animationDelay: '-6s' }} />
      <div className="absolute rounded-full pointer-events-none" style={{ width: 200, height: 200, background: '#C0574B', filter: 'blur(80px)', opacity: 0.08, top: '40%', right: '10%', animation: 'floatBlob 12s ease-in-out infinite', animationDelay: '-3s' }} />

      <div className="max-w-xl mx-auto relative">
        <h1
          className="text-3xl leading-tight flex items-center gap-2 mb-2"
          style={{ fontFamily: headingFont, letterSpacing: 'normal' }}
        >
          <span style={{ display: 'inline-block', transform: 'skewX(-12deg)', fontFamily: 'sans-serif', fontWeight: 800, background: 'linear-gradient(90deg, #D97757, #BD5D3A)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>#</span>
          <span style={{ background: 'linear-gradient(90deg, #D97757, #BD5D3A)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{t.title}</span>
        </h1>
        <p className="text-sm mb-6" style={{ color: '#87837A' }}>{t.subtitle}</p>

        <div className="rounded-xl p-5 space-y-4" style={{ background: '#FFFFFF', border: '1px solid #E4E1D6', boxShadow: '0 0 24px rgba(189,93,58,0.06)' }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.businessLabel}</label>
            <input
              type="text"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder={t.businessPh}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
              onFocus={(e) => { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E4E1D6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.brandVoiceLabel}</label>
            <input
              type="text"
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              placeholder={t.brandVoicePh}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
              style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
              onFocus={(e) => { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E4E1D6'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium" style={{ color: '#6B6659' }}>
                {batchMode ? t.batchLabel : t.postLabel}
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#87837A' }}>
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  style={{ accentColor: '#D97757' }}
                />
                {t.batchToggle}
              </label>
            </div>
            {batchMode ? (
              <textarea
                value={batchTopics}
                onChange={(e) => setBatchTopics(e.target.value)}
                placeholder={t.batchPh}
                rows={4}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
                onFocus={(e) => { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E4E1D6'; e.target.style.boxShadow = 'none'; }}
              />
            ) : (
              <textarea
                value={postAbout}
                onChange={(e) => setPostAbout(e.target.value)}
                placeholder={t.postPh}
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
                onFocus={(e) => { e.target.style.borderColor = '#D97757'; e.target.style.boxShadow = '0 0 0 3px rgba(217,119,87,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E4E1D6'; e.target.style.boxShadow = 'none'; }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.photoLabel}</label>
            <label
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer"
              style={{ background: '#FAF9F4', border: '1px dashed #E4E1D6', color: '#87837A' }}
            >
              {photo ? (
                <img src={photo} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: 6, background: '#EDEAE0', flexShrink: 0 }} />
              )}
              <span>{photo ? t.changePhoto : t.uploadPhoto}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.videoLabel}</label>
            <label
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm cursor-pointer"
              style={{ background: '#FAF9F4', border: '1px dashed #E4E1D6', color: '#87837A' }}
            >
              {video ? (
                <video src={video} muted loop autoPlay playsInline style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <span style={{ width: 32, height: 32, borderRadius: 6, background: '#EDEAE0', flexShrink: 0 }} />
              )}
              <span>{video ? t.changeVideo : t.uploadVideo}</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.platformLabel}</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="whatsapp">{t.whatsappStatus}</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="twitter">Twitter / X</option>
                <option value="pinterest">Pinterest</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#6B6659' }}>{t.languageLabel}</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#2D2A26' }}
              >
                {languages.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: '#6B6659' }}>
              <input
                type="checkbox"
                checked={includeEmoji}
                onChange={(e) => setIncludeEmoji(e.target.checked)}
                style={{ accentColor: '#D97757' }}
              />
              {t.emojiToggle}
            </label>
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #E4E1D6' }}>
              <button
                type="button"
                onClick={() => setLengthMode('short')}
                className="text-xs px-3 py-1.5"
                style={{ background: lengthMode === 'short' ? '#E4E1D6' : 'transparent', color: lengthMode === 'short' ? '#D97757' : '#87837A' }}
              >
                {t.lengthShort}
              </button>
              <button
                type="button"
                onClick={() => setLengthMode('detailed')}
                className="text-xs px-3 py-1.5"
                style={{ background: lengthMode === 'detailed' ? '#E4E1D6' : 'transparent', color: lengthMode === 'detailed' ? '#D97757' : '#87837A' }}
              >
                {t.lengthDetailed}
              </button>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: '#B34B3C' }}>{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full font-medium py-2.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
            style={{
              background: loading ? '#E4E1D6' : 'linear-gradient(90deg, #D97757, #BD5D3A)',
              color: loading ? '#87837A' : '#F5F4EE',
              boxShadow: loading ? 'none' : '0 0 20px rgba(217,119,87,0.25)'
            }}
          >
            {loading ? (
              <>
                <span>{t.generating}</span>
                <span style={{ display: 'inline-flex', gap: '3px' }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#87837A', animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#87837A', animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '0.15s' }} />
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#87837A', animation: 'pulseDot 1.2s ease-in-out infinite', animationDelay: '0.3s' }} />
                </span>
              </>
            ) : t.generate}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-6 space-y-6">
            {results.map((item, idx) => {
              const display = item.activeLang && item.translations[item.activeLang]
                ? item.translations[item.activeLang]
                : item;
              return (
                <div key={idx} className="space-y-4">
                  {batchMode && (
                    <p className="text-xs font-medium" style={{ color: '#A56A45' }}>{item.topic}</p>
                  )}

                  {!batchMode && (
                    <div>
                      <h2 className="text-sm font-semibold mb-2" style={{ color: '#D97757' }}>{t.preview}</h2>
                      <div className="rounded-xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E4E1D6' }}>
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #D97757, #BD5D3A)', flexShrink: 0 }} />
                          <span className="text-sm font-medium" style={{ color: '#2D2A26' }}>{business || '—'}</span>
                        </div>
                        {photo ? (
                          <img src={photo} alt="" style={{ width: '100%', aspectRatio: '1.6 / 1', borderRadius: 10, objectFit: 'cover', marginBottom: 12 }} />
                        ) : (
                          <div style={{ width: '100%', aspectRatio: '1.6 / 1', borderRadius: 10, background: 'linear-gradient(135deg, rgba(217,119,87,0.10), rgba(189,93,58,0.10))', marginBottom: 12 }} />
                        )}
                        <p className="text-sm mb-2" style={{ color: '#3A362F' }}>{display.captions[item.activeCaption]}</p>
                        <div className="flex flex-wrap gap-1">
                          {display.hashtags.slice(0, 5).map((tag, i) => (
                            <span key={i} className="text-xs" style={{ color: '#A56A45' }}>#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-sm font-semibold mb-2" style={{ color: '#D97757' }}>{t.captionsHeading}</h2>
                    <div className="space-y-2">
                      {display.captions.map((cap, i) => (
                        <div
                          key={i}
                          onClick={() => setResultActiveCaption(idx, i)}
                          className="rounded-lg p-3 flex items-start justify-between gap-3 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                          style={{
                            background: '#FFFFFF',
                            border: item.activeCaption === i ? '1px solid #D97757' : '1px solid #E4E1D6',
                            boxShadow: item.activeCaption === i ? '0 6px 16px rgba(217,119,87,0.10)' : 'none'
                          }}
                        >
                          <p className="text-sm flex-1" style={{ color: '#3A362F' }}>{cap}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopy(cap, `cap-${idx}-${i}`); }}
                            className="text-xs whitespace-nowrap flex-shrink-0"
                            style={{ color: copied === `cap-${idx}-${i}` ? '#D97757' : '#BD5D3A' }}
                          >
                            {copied === `cap-${idx}-${i}` ? t.copied : t.copy}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {display.cta && (
                    <div>
                      <h2 className="text-sm font-semibold mb-2" style={{ color: '#D97757' }}>{t.ctaHeading}</h2>
                      <div className="rounded-lg p-3 flex items-center justify-between gap-3" style={{ background: '#FFFFFF', border: '1px solid #E4E1D6' }}>
                        <p className="text-sm flex-1" style={{ color: '#3A362F' }}>{display.cta}</p>
                        <button
                          onClick={() => handleCopy(display.cta, `cta-${idx}`)}
                          className="text-xs whitespace-nowrap flex-shrink-0"
                          style={{ color: copied === `cta-${idx}` ? '#D97757' : '#BD5D3A' }}
                        >
                          {copied === `cta-${idx}` ? t.copied : t.copy}
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-sm font-semibold mb-2" style={{ color: '#D97757' }}>{t.hashtagsHeading}</h2>
                    <div className="rounded-lg p-3" style={{ background: '#FFFFFF', border: '1px solid #E4E1D6' }}>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {display.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(189,93,58,0.12)', color: '#8B5A3E', border: '1px solid rgba(189,93,58,0.25)' }}>#{tag}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => handleCopy(display.hashtags.map(h => `#${h}`).join(' '), `tags-${idx}`)}
                        className="text-xs"
                        style={{ color: copied === `tags-${idx}` ? '#D97757' : '#BD5D3A' }}
                      >
                        {copied === `tags-${idx}` ? t.copied : t.copyAll}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {item.activeLang && (
                      <button
                        onClick={() => setActiveLang(idx, null)}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: '#E4E1D6', color: '#2D2A26' }}
                      >
                        {currentLang.label}
                      </button>
                    )}
                    {Object.keys(item.translations).map(langCode => {
                      const lang = languages.find(l => l.code === langCode);
                      return (
                        <button
                          key={langCode}
                          onClick={() => setActiveLang(idx, langCode)}
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: item.activeLang === langCode ? '#D97757' : '#E4E1D6',
                            color: item.activeLang === langCode ? '#F5F4EE' : '#2D2A26'
                          }}
                        >
                          {lang ? lang.label : langCode}
                        </button>
                      );
                    })}
                    <select
                      onChange={(e) => { if (e.target.value) { handleTranslate(idx, e.target.value); e.target.value = ''; } }}
                      disabled={translatingIndex === idx}
                      className="text-xs rounded-full px-2 py-1 focus:outline-none"
                      style={{ background: '#FAF9F4', border: '1px solid #E4E1D6', color: '#87837A' }}
                      defaultValue=""
                    >
                      <option value="" disabled>{translatingIndex === idx ? '...' : `+ ${t.translateTo}`}</option>
                      {languages.filter(l => l.code !== language).map(l => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold mb-2" style={{ color: '#87837A' }}>{t.historyHeading}</h2>
            <div className="space-y-2">
              {history.map((item, i) => (
                <div
                  key={i}
                  onClick={() => loadFromHistory(item)}
                  className="rounded-lg px-3 py-2 cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ background: '#FFFFFF', border: '1px solid #E4E1D6' }}
                >
                  <p className="text-xs truncate" style={{ color: '#87837A' }}>
                    <span style={{ color: '#8B5A3E' }}>{item.business}</span> · {item.results[0]?.captions[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col items-center justify-center gap-1.5 mt-10 pt-6" style={{ borderTop: '1px solid #E4E1D6' }}>
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#87837A" strokeWidth="1.5">
              <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" />
            </svg>
            <span className="text-xs" style={{ color: '#87837A' }}>Powered by Claude</span>
          </div>
          <span className="text-xs" style={{ color: '#B5B0A3' }}>Fair use: up to 50 generations per day</span>
        </div>
      </div>
    </div>
  );
}
