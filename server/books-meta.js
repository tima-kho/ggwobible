/**
 * Справочник 66 канонических книг Библии.
 *
 * Поля:
 *   id        — порядковый номер 1..66
 *   slug      — слаг для имени файла, напр. "01-genesis"
 *   abbr      — короткая аббревиатура (3 буквы)
 *   en        — английское имя книги (как в исходных JSON)
 *   ru        — короткое русское имя для UI и ссылок ("Иоанна 3:16")
 *   ruFull    — полное русское имя для отображения в шапке книги
 *   testament — "OT" (Ветхий) или "NT" (Новый)
 *
 * Английские имена должны точно совпадать с book_name в RST NDJSON
 * и с порядковыми номерами в KJV.
 */
export const BOOKS = [
  // ============ Ветхий Завет (39) ============
  { id: 1,  slug: '01-genesis',         abbr: 'Gen', en: 'Genesis',         ru: 'Бытие',               ruFull: 'Книга Бытия',                            testament: 'OT' },
  { id: 2,  slug: '02-exodus',          abbr: 'Exo', en: 'Exodus',          ru: 'Исход',               ruFull: 'Книга Исход',                            testament: 'OT' },
  { id: 3,  slug: '03-leviticus',       abbr: 'Lev', en: 'Leviticus',       ru: 'Левит',               ruFull: 'Книга Левит',                            testament: 'OT' },
  { id: 4,  slug: '04-numbers',         abbr: 'Num', en: 'Numbers',         ru: 'Числа',               ruFull: 'Книга Чисел',                            testament: 'OT' },
  { id: 5,  slug: '05-deuteronomy',     abbr: 'Deu', en: 'Deuteronomy',     ru: 'Второзаконие',        ruFull: 'Книга Второзаконие',                     testament: 'OT' },
  { id: 6,  slug: '06-joshua',          abbr: 'Jos', en: 'Joshua',          ru: 'Иисус Навин',         ruFull: 'Книга Иисуса Навина',                    testament: 'OT' },
  { id: 7,  slug: '07-judges',          abbr: 'Jdg', en: 'Judges',          ru: 'Судьи',               ruFull: 'Книга Судей израилевых',                 testament: 'OT' },
  { id: 8,  slug: '08-ruth',            abbr: 'Rut', en: 'Ruth',            ru: 'Руфь',                ruFull: 'Книга Руфь',                             testament: 'OT' },
  { id: 9,  slug: '09-1-samuel',        abbr: '1Sa', en: '1 Samuel',        ru: '1-я Царств',          ruFull: 'Первая книга Царств',                    testament: 'OT' },
  { id: 10, slug: '10-2-samuel',        abbr: '2Sa', en: '2 Samuel',        ru: '2-я Царств',          ruFull: 'Вторая книга Царств',                    testament: 'OT' },
  { id: 11, slug: '11-1-kings',         abbr: '1Ki', en: '1 Kings',         ru: '3-я Царств',          ruFull: 'Третья книга Царств',                    testament: 'OT' },
  { id: 12, slug: '12-2-kings',         abbr: '2Ki', en: '2 Kings',         ru: '4-я Царств',          ruFull: 'Четвертая книга Царств',                 testament: 'OT' },
  { id: 13, slug: '13-1-chronicles',    abbr: '1Ch', en: '1 Chronicles',    ru: '1-я Паралипоменон',   ruFull: 'Первая книга Паралипоменон',             testament: 'OT' },
  { id: 14, slug: '14-2-chronicles',    abbr: '2Ch', en: '2 Chronicles',    ru: '2-я Паралипоменон',   ruFull: 'Вторая книга Паралипоменон',             testament: 'OT' },
  { id: 15, slug: '15-ezra',            abbr: 'Ezr', en: 'Ezra',            ru: 'Ездра',               ruFull: 'Книга Ездры',                            testament: 'OT' },
  { id: 16, slug: '16-nehemiah',        abbr: 'Neh', en: 'Nehemiah',        ru: 'Неемия',              ruFull: 'Книга Неемии',                           testament: 'OT' },
  { id: 17, slug: '17-esther',          abbr: 'Est', en: 'Esther',          ru: 'Есфирь',              ruFull: 'Книга Есфирь',                           testament: 'OT' },
  { id: 18, slug: '18-job',             abbr: 'Job', en: 'Job',             ru: 'Иов',                 ruFull: 'Книга Иова',                             testament: 'OT' },
  { id: 19, slug: '19-psalms',          abbr: 'Psa', en: 'Psalms',          ru: 'Псалтирь',            ruFull: 'Псалтирь',                               testament: 'OT' },
  { id: 20, slug: '20-proverbs',        abbr: 'Pro', en: 'Proverbs',        ru: 'Притчи',              ruFull: 'Книга Притчей Соломоновых',              testament: 'OT' },
  { id: 21, slug: '21-ecclesiastes',    abbr: 'Ecc', en: 'Ecclesiastes',    ru: 'Екклесиаст',          ruFull: 'Книга Екклесиаста',                      testament: 'OT' },
  { id: 22, slug: '22-song-of-solomon', abbr: 'Sng', en: 'Song of Solomon', ru: 'Песнь Песней',        ruFull: 'Песнь Песней Соломона',                  testament: 'OT' },
  { id: 23, slug: '23-isaiah',          abbr: 'Isa', en: 'Isaiah',          ru: 'Исаия',               ruFull: 'Книга пророка Исаии',                    testament: 'OT' },
  { id: 24, slug: '24-jeremiah',        abbr: 'Jer', en: 'Jeremiah',        ru: 'Иеремия',             ruFull: 'Книга пророка Иеремии',                  testament: 'OT' },
  { id: 25, slug: '25-lamentations',    abbr: 'Lam', en: 'Lamentations',    ru: 'Плач Иеремии',        ruFull: 'Плач Иеремии',                           testament: 'OT' },
  { id: 26, slug: '26-ezekiel',         abbr: 'Eze', en: 'Ezekiel',         ru: 'Иезекииль',           ruFull: 'Книга пророка Иезекииля',                testament: 'OT' },
  { id: 27, slug: '27-daniel',          abbr: 'Dan', en: 'Daniel',          ru: 'Даниил',              ruFull: 'Книга пророка Даниила',                  testament: 'OT' },
  { id: 28, slug: '28-hosea',           abbr: 'Hos', en: 'Hosea',           ru: 'Осия',                ruFull: 'Книга пророка Осии',                     testament: 'OT' },
  { id: 29, slug: '29-joel',            abbr: 'Joe', en: 'Joel',            ru: 'Иоиль',               ruFull: 'Книга пророка Иоиля',                    testament: 'OT' },
  { id: 30, slug: '30-amos',            abbr: 'Amo', en: 'Amos',            ru: 'Амос',                ruFull: 'Книга пророка Амоса',                    testament: 'OT' },
  { id: 31, slug: '31-obadiah',         abbr: 'Oba', en: 'Obadiah',         ru: 'Авдий',               ruFull: 'Книга пророка Авдия',                    testament: 'OT' },
  { id: 32, slug: '32-jonah',           abbr: 'Jon', en: 'Jonah',           ru: 'Иона',                ruFull: 'Книга пророка Ионы',                     testament: 'OT' },
  { id: 33, slug: '33-micah',           abbr: 'Mic', en: 'Micah',           ru: 'Михей',               ruFull: 'Книга пророка Михея',                    testament: 'OT' },
  { id: 34, slug: '34-nahum',           abbr: 'Nah', en: 'Nahum',           ru: 'Наум',                ruFull: 'Книга пророка Наума',                    testament: 'OT' },
  { id: 35, slug: '35-habakkuk',        abbr: 'Hab', en: 'Habakkuk',        ru: 'Аввакум',             ruFull: 'Книга пророка Аввакума',                 testament: 'OT' },
  { id: 36, slug: '36-zephaniah',       abbr: 'Zep', en: 'Zephaniah',       ru: 'Софония',             ruFull: 'Книга пророка Софонии',                  testament: 'OT' },
  { id: 37, slug: '37-haggai',          abbr: 'Hag', en: 'Haggai',          ru: 'Аггей',               ruFull: 'Книга пророка Аггея',                    testament: 'OT' },
  { id: 38, slug: '38-zechariah',       abbr: 'Zec', en: 'Zechariah',       ru: 'Захария',             ruFull: 'Книга пророка Захарии',                  testament: 'OT' },
  { id: 39, slug: '39-malachi',         abbr: 'Mal', en: 'Malachi',         ru: 'Малахия',             ruFull: 'Книга пророка Малахии',                  testament: 'OT' },

  // ============ Новый Завет (27) ============
  { id: 40, slug: '40-matthew',         abbr: 'Mat', en: 'Matthew',         ru: 'Матфея',              ruFull: 'От Матфея святое благовествование',      testament: 'NT' },
  { id: 41, slug: '41-mark',            abbr: 'Mar', en: 'Mark',            ru: 'Марка',               ruFull: 'От Марка святое благовествование',       testament: 'NT' },
  { id: 42, slug: '42-luke',            abbr: 'Luk', en: 'Luke',            ru: 'Луки',                ruFull: 'От Луки святое благовествование',        testament: 'NT' },
  { id: 43, slug: '43-john',            abbr: 'Joh', en: 'John',            ru: 'Иоанна',              ruFull: 'От Иоанна святое благовествование',      testament: 'NT' },
  { id: 44, slug: '44-acts',            abbr: 'Act', en: 'Acts',            ru: 'Деяния',              ruFull: 'Деяния святых Апостолов',                testament: 'NT' },
  { id: 45, slug: '45-romans',          abbr: 'Rom', en: 'Romans',          ru: 'Римлянам',            ruFull: 'Послание к Римлянам',                    testament: 'NT' },
  { id: 46, slug: '46-1-corinthians',   abbr: '1Co', en: '1 Corinthians',   ru: '1-е Коринфянам',      ruFull: 'Первое послание к Коринфянам',           testament: 'NT' },
  { id: 47, slug: '47-2-corinthians',   abbr: '2Co', en: '2 Corinthians',   ru: '2-е Коринфянам',      ruFull: 'Второе послание к Коринфянам',           testament: 'NT' },
  { id: 48, slug: '48-galatians',       abbr: 'Gal', en: 'Galatians',       ru: 'Галатам',             ruFull: 'Послание к Галатам',                     testament: 'NT' },
  { id: 49, slug: '49-ephesians',       abbr: 'Eph', en: 'Ephesians',       ru: 'Ефесянам',            ruFull: 'Послание к Ефесянам',                    testament: 'NT' },
  { id: 50, slug: '50-philippians',     abbr: 'Phi', en: 'Philippians',     ru: 'Филиппийцам',         ruFull: 'Послание к Филиппийцам',                 testament: 'NT' },
  { id: 51, slug: '51-colossians',      abbr: 'Col', en: 'Colossians',      ru: 'Колоссянам',          ruFull: 'Послание к Колоссянам',                  testament: 'NT' },
  { id: 52, slug: '52-1-thessalonians', abbr: '1Th', en: '1 Thessalonians', ru: '1-е Фессалоникийцам', ruFull: 'Первое послание к Фессалоникийцам',      testament: 'NT' },
  { id: 53, slug: '53-2-thessalonians', abbr: '2Th', en: '2 Thessalonians', ru: '2-е Фессалоникийцам', ruFull: 'Второе послание к Фессалоникийцам',      testament: 'NT' },
  { id: 54, slug: '54-1-timothy',       abbr: '1Ti', en: '1 Timothy',       ru: '1-е Тимофею',         ruFull: 'Первое послание к Тимофею',              testament: 'NT' },
  { id: 55, slug: '55-2-timothy',       abbr: '2Ti', en: '2 Timothy',       ru: '2-е Тимофею',         ruFull: 'Второе послание к Тимофею',              testament: 'NT' },
  { id: 56, slug: '56-titus',           abbr: 'Tit', en: 'Titus',           ru: 'Титу',                ruFull: 'Послание к Титу',                        testament: 'NT' },
  { id: 57, slug: '57-philemon',        abbr: 'Phm', en: 'Philemon',        ru: 'Филимону',            ruFull: 'Послание к Филимону',                    testament: 'NT' },
  { id: 58, slug: '58-hebrews',         abbr: 'Heb', en: 'Hebrews',         ru: 'Евреям',              ruFull: 'Послание к Евреям',                      testament: 'NT' },
  { id: 59, slug: '59-james',           abbr: 'Jam', en: 'James',           ru: 'Иакова',              ruFull: 'Послание Иакова',                        testament: 'NT' },
  { id: 60, slug: '60-1-peter',         abbr: '1Pe', en: '1 Peter',         ru: '1-е Петра',           ruFull: 'Первое послание Петра',                  testament: 'NT' },
  { id: 61, slug: '61-2-peter',         abbr: '2Pe', en: '2 Peter',         ru: '2-е Петра',           ruFull: 'Второе послание Петра',                  testament: 'NT' },
  { id: 62, slug: '62-1-john',          abbr: '1Jo', en: '1 John',          ru: '1-е Иоанна',          ruFull: 'Первое послание Иоанна',                 testament: 'NT' },
  { id: 63, slug: '63-2-john',          abbr: '2Jo', en: '2 John',          ru: '2-е Иоанна',          ruFull: 'Второе послание Иоанна',                 testament: 'NT' },
  { id: 64, slug: '64-3-john',          abbr: '3Jo', en: '3 John',          ru: '3-е Иоанна',          ruFull: 'Третье послание Иоанна',                 testament: 'NT' },
  { id: 65, slug: '65-jude',            abbr: 'Jud', en: 'Jude',            ru: 'Иуды',                ruFull: 'Послание Иуды',                          testament: 'NT' },
  { id: 66, slug: '66-revelation',      abbr: 'Rev', en: 'Revelation',      ru: 'Откровение',          ruFull: 'Откровение Иоанна Богослова',            testament: 'NT' }
];

/** Доступные переводы. */
export const TRANSLATIONS = [
  { code: 'rst', name: 'Русский Синодальный', shortName: 'РСТ', lang: 'ru' },
  { code: 'kjv', name: 'King James Version',  shortName: 'KJV', lang: 'en' }
];

/** Быстрые карты для поиска книги по разным ключам. */
export const BY_ID    = new Map(BOOKS.map(b => [b.id, b]));
export const BY_EN    = new Map(BOOKS.map(b => [b.en, b]));
export const BY_SLUG  = new Map(BOOKS.map(b => [b.slug, b]));
