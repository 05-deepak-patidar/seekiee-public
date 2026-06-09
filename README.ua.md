# Seekiee

[English](README.md) | [Español](README.es.md) | [Português (Brasil)](README.pt-BR.md) | [한국어](README.ko-KR.md) | [日本語](README.ja.md) | [Українська](README.ua.md) | [Русский](README.ru.md) | [繁體中文](README.zh-TW.md)

<p align="center">
  <a href="https://x.com/seekiee"><img src="docs/hero-banner.jpg" alt="Seekiee — Multi-Agent Система Пошуку Роботи" width="800"></a>
</p>

<p align="center">
  <em>Я провів місяці у пошуках роботи, роблячи все самотужки. Тому я створив систему, яку хотів би мати з самого початку.</em><br>
  Компанії використовують AI для фільтрації кандидатів. <strong>Я дав кандидатам AI, щоб вони могли <em>вибирати</em> компанії.</strong><br>
  <em>Тепер це open source.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white" alt="Claude Code">
  <img src="https://img.shields.io/badge/OpenCode-111827?style=flat&logo=terminal&logoColor=white" alt="OpenCode">
  <img src="https://img.shields.io/badge/Codex_(soon)-6B7280?style=flat&logo=openai&logoColor=white" alt="Codex">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white" alt="Playwright">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT">
  <a href="https://discord.gg/8pRpHETxa4"><img src="https://img.shields.io/badge/Discord-5865F2?style=flat&logo=discord&logoColor=white" alt="Discord"></a>
  <br>
  <img src="https://img.shields.io/badge/EN-blue?style=flat" alt="EN">
  <img src="https://img.shields.io/badge/ES-red?style=flat" alt="ES">
  <img src="https://img.shields.io/badge/DE-grey?style=flat" alt="DE">
  <img src="https://img.shields.io/badge/FR-blue?style=flat" alt="FR">
  <img src="https://img.shields.io/badge/PT--BR-green?style=flat" alt="PT-BR">
  <img src="https://img.shields.io/badge/KO-white?style=flat" alt="KO">
  <img src="https://img.shields.io/badge/JA-red?style=flat" alt="JA">
  <img src="https://img.shields.io/badge/ZH--TW-blue?style=flat" alt="ZH-TW">
  <img src="https://img.shields.io/badge/UA-blue?style=flat" alt="UA">
</p>

---

<p align="center">
  <img src="docs/demo.gif" alt="Демо Seekiee" width="800">
</p>

<p align="center"><strong>740+ вакансій оцінено · 100+ персоналізованих резюме · 1 роботу мрії отримано</strong></p>

<p align="center"><a href="https://discord.gg/8pRpHETxa4"><img src="https://img.shields.io/badge/Приєднатися_до_спільноти-Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a></p>

## Що це таке

Seekiee перетворює будь-який AI-кодинг CLI на повноцінний командний центр для пошуку роботи. Замість ручного відстеження заявок у таблиці, ви отримуєте AI-pipeline, який:

- **Оцінює вакансії** за структурованою системою балів A-F (10 зважених параметрів)
- **Генерує персоналізовані PDF** — ATS-оптимізовані резюме під кожен опис вакансії
- **Сканує портали** автоматично (Greenhouse, Ashby, Lever, сторінки компаній)
- **Пакетна обробка** — оцінка 10+ вакансій паралельно суб-агентами
- **Відстежує все** в єдиному джерелі даних з перевіркою цілісності

> **Важливо: це НЕ інструмент для масової розсилки.** Seekiee — це фільтр, який допомагає знайти кілька вакансій, вартих вашого часу, серед сотень. Система наполегливо рекомендує не подаватися на вакансії з балом нижче 4.0/5. Ваш час цінний, як і час рекрутера. Завжди перевіряйте все перед подачею заявки.

Seekiee працює агентно: Claude Code переходить на кар'єрні сторінки за допомогою Playwright, оцінює відповідність, аналізуючи ваше резюме відносно опису вакансії (не за ключовими словами), та адаптує ваше резюме під кожну вакансію.

> **Зверніть увагу: перші оцінки будуть не ідеальними.** Система ще не знає вас. Дайте їй контекст — ваше резюме, вашу кар'єрну історію, ваші досягнення, уподобання, сильні сторони, що хочете уникати. Чим більше ви її "навчаєте", тим краще вона стає. Уявіть, що ви вводите в курс справ нового рекрутера: перший тиждень він вивчає вас, а потім стає незамінним.

Створено людиною, яка використовувала систему для оцінки 740+ вакансій, генерації 100+ персоналізованих резюме та отримання посади Head of Applied AI. [Читати повний кейс](https://darkiee.com/seekiee-system).

## Що система вміє

| Функція                       | Опис                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Авто-конвеєр**              | Вставте URL — отримайте повну оцінку + PDF + запис у трекері                                                                                     |
| **6-блокова оцінка**          | Опис ролі, відповідність резюме, стратегія рівня, дослідження компенсації, персоналізація, підготовка до інтерв'ю (STAR+R)                       |
| **Банк історій для інтерв'ю** | Накопичує STAR+Reflection історії з оцінок — 5-10 майстер-історій, що відповідають на будь-яке поведінкове питання                               |
| **Скрипти переговорів**       | Фреймворки переговорів про зарплату, протидія географічним знижкам, використання конкуруючих пропозицій                                          |
| **Генерація ATS PDF**         | Резюме з впровадженими ключовими словами, дизайн Space Grotesk + DM Sans                                                                         |
| **Сканер порталів**           | 45+ попередньо налаштованих компаній (Anthropic, OpenAI, ElevenLabs, Retool, n8n...) + кастомні запити через Ashby, Greenhouse, Lever, Wellfound |
| **Пакетна обробка**           | Паралельна оцінка з `claude -p` воркерами                                                                                                        |
| **Дашборд TUI**               | Термінальний інтерфейс для перегляду, фільтрації та сортування вашого конвеєра                                                                   |
| **Human-in-the-Loop**         | AI оцінює та рекомендує, ви вирішуєте та дієте. Система ніколи не подає заявку — остаточне рішення завжди за вами                                |
| **Цілісність конвеєра**       | Автоматичне злиття, дедуплікація, нормалізація статусів, перевірки стану                                                                         |

## Швидкий старт

```bash
# 1. Клонування та встановлення
git clone https://github.com/05-deepak-patidar/Seekiee.git
cd seekiee && npm install
npx playwright install chromium   # Необхідно для генерації PDF

# 2. Перевірка налаштувань
npm run doctor                     # Валідує всі передумови

# 3. Конфігурація
cp config/profile.example.yml config/profile.yml  # Відредагуйте під себе
cp templates/portals.example.yml portals.yml       # Налаштуйте компанії

# 4. Додайте ваше резюме
# Створіть cv.md у кореневій директорії проєкту з вашим резюме у markdown

# 5. Персоналізація з Claude
claude   # Відкрийте Claude Code у цій директорії

# Потім попросіть Claude адаптувати систему під вас, наприклад:
# "Зміни архетипи на ролі бекенд-розробника"
# "Переклади режими англійською"
# "Додай ці 5 компаній до portals.yml"
# "Оновити мій профіль з цим резюме, яке я вставляю"

# 6. Починайте використовувати
# Вставте URL вакансії або запустіть /seekiee
```

> **Система створена для налаштування самим Claude.** Режими, архетипи, оцінювання, скрипти переговорів — просто попросіть Claude їх змінити. Він читає ті самі файли, які використовує, тому точно знає, що редагувати.

Дивіться [docs/SETUP.md](docs/SETUP.md) як повний посібник з налаштування.

## Використання

Seekiee — це одна слеш-команда з кількома режимами:

```text
/seekiee                → Показати всі доступні команди
/seekiee {вставити JD}  → Повний авто-конвеєр (оцінка + PDF + трекер)
/seekiee scan           → Сканувати портали на нові вакансії
/seekiee pdf            → Згенерувати ATS-оптимізоване резюме
/seekiee batch          → Пакетна оцінка кількох вакансій
/seekiee tracker        → Переглянути статус заявок
/seekiee apply          → Заповнити форми заявок з AI
/seekiee pipeline       → Обробити очікуючі URL
/seekiee outreach       → Повідомлення для LinkedIn outreach
/seekiee deep           → Глибоке дослідження компанії
/seekiee training       → Оцінити курс/сертифікацію
/seekiee project        → Оцінити портфоліо-проєкт
```

Або просто вставте URL вакансії чи її опис — seekiee автоматично визначить це та запустить повний конвеєр.

## Як це працює

```text
Ви вставляєте URL вакансії або опис
        │
        ▼
┌──────────────────┐
│  Визначення      │  Класифікує: LLMOps / Agentic / PM / SA / FDE / Transformation
│  архетипу        │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Оцінка A-F      │  Відповідність, прогалини, дослідження компенсації, STAR-історії
│  (читає cv.md)   │
└────────┬─────────┘
         │
    ┌────┼────┐
    ▼    ▼    ▼
 Звіт  PDF  Трекер
  .md   .pdf   .tsv
```

## Попередньо налаштовані портали

Сканер поставляється з **45+ компаніями**, готовими до сканування, та **19 пошуковими запитами** по основних дошках вакансій. Скопіюйте `templates/portals.example.yml` у `portals.yml` та додайте свої:

**AI-лабораторії:** Anthropic, OpenAI, Mistral, Cohere, LangChain, Pinecone
**Голосовий AI:** ElevenLabs, PolyAI, Parloa, Hume AI, Deepgram, Vapi, Bland AI
**AI-платформи:** Retool, Airtable, Vercel, Temporal, Glean, Arize AI
**Контакт-центри:** Ada, LivePerson, Sierra, Decagon, Talkdesk, Genesys
**Enterprise:** Salesforce, Twilio, Gong, Dialpad
**LLMOps:** Langfuse, Weights & Biases, Lindy, Cognigy, Speechmatics
**Автоматизація:** n8n, Zapier, Make.com
**Європейські:** Factorial, Attio, Tinybird, Clarity AI, Travelperk

**Дошки вакансій:** Ashby, Greenhouse, Lever, Wellfound, Workable, RemoteFront

## Дашборд TUI

Вбудований термінальний дашборд дозволяє візуально переглядати поточний стан вашого конвеєра:

```bash
cd dashboard
go build -o career-dashboard .
./career-dashboard --path ..
```

Функції: 6 вкладок фільтрації, 4 режими сортування, групований/плаский вигляд, lazy-load попереднього перегляду, inline зміна статусів.

## Структура проєкту

```text
seekiee/
├── CLAUDE.md                    # Інструкції для агента
├── cv.md                        # Ваше резюме (створіть цей файл)
├── article-digest.md            # Ваші досягнення (необов'язково)
├── config/
│   └── profile.example.yml      # Шаблон для вашого профілю
├── modes/                       # 14 режимів навичок
│   ├── _shared.md               # Спільний контекст (налаштуйте)
│   ├── oferta.md                # Одиночна оцінка
│   ├── pdf.md                   # Генерація PDF
│   ├── scan.md                  # Сканер порталів
│   ├── batch.md                 # Пакетна обробка
│   └── ...
├── templates/
│   ├── cv-template.html         # ATS-оптимізований шаблон резюме
│   ├── portals.example.yml      # Шаблон конфігурації сканера
│   └── states.yml               # Канонічні статуси
├── batch/
│   ├── batch-prompt.md          # Самодостатній промпт воркера
│   └── batch-runner.sh          # Скрипт-оркестратор
├── dashboard/                   # Go TUI для перегляду конвеєра
├── data/                        # Ваші дані відстеження (gitignored)
├── reports/                     # Звіти оцінок (gitignored)
├── output/                      # Згенеровані PDF (gitignored)
├── fonts/                       # Space Grotesk + DM Sans
├── docs/                        # Налаштування, кастомізація, архітектура
└── examples/                    # Приклади резюме, звітів, досягнень
```

## Технологічний стек

![Claude Code](https://img.shields.io/badge/Claude_Code-000?style=flat&logo=anthropic&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat&logo=go&logoColor=white)
![Bubble Tea](https://img.shields.io/badge/Bubble_Tea-FF75B5?style=flat&logo=go&logoColor=white)

- **Агент**: Claude Code з кастомними навичками та режимами
- **PDF**: Playwright/Puppeteer + HTML-шаблон
- **Сканер**: Playwright + Greenhouse API + WebSearch
- **Дашборд**: Go + Bubble Tea + Lipgloss (тема Catppuccin Mocha)
- **Дані**: Markdown-таблиці + YAML-конфігурація + TSV-пакетні файли

## Також у відкритому коді

- **[cv-santiago](https://github.com/seekiee/cv-santiago)** — Портфоліо-сайт (darkiee.com) з AI-чатботом, LLMOps-дашбордом та кейсами. Якщо вам потрібне портфоліо для демонстрації під час пошуку роботи, форкніть його та зробіть своїм.

## Про автора

Я Сантьяго — Head of Applied AI, колишній засновник (побудував і продав бізнес, який досі працює під моїм ім'ям). Я створив seekiee для управління власним пошуком роботи. Це спрацювало: я використав його, щоб отримати свою поточну посаду.

Моє портфоліо та інші open source проєкти → [darkiee.com](https://darkiee.com)

☕ [Пригостіть мене кавою](https://buymeacoffee.com/seekiee), якщо seekiee допоміг у вашому пошуку роботи.

## Історія зірок

<a href="https://www.star-history.com/?repos=05-deepak-patidar%2FSeekiee&type=timeline&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=seekiee/seekiee&type=timeline&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=seekiee/seekiee&type=timeline&legend=top-left" />
   <img alt="Графік історії зірок" src="https://api.star-history.com/chart?repos=seekiee/seekiee&type=timeline&legend=top-left" />
 </picture>
</a>

## Застереження

**seekiee — це локальний інструмент з відкритим кодом, а НЕ хмарний сервіс.** Використовуючи це програмне забезпечення, ви підтверджуєте:

1. **Ви контролюєте свої дані.** Ваше резюме, контактна інформація та персональні дані залишаються на вашому комп'ютері і надсилаються безпосередньо обраному вами AI-провайдеру (Anthropic, OpenAI тощо). Ми не збираємо, не зберігаємо та не маємо доступу до жодних ваших даних.
2. **Ви контролюєте AI.** Промпти за замовчуванням інструктують AI не подавати заявки автоматично, але AI-моделі можуть поводитися непередбачувано. Якщо ви змінюєте промпти або використовуєте інші моделі, ви робите це на власний ризик. **Завжди перевіряйте AI-згенерований контент на точність перед подачею.**
3. **Ви дотримуєтеся умов сервісу третіх сторін.** Ви повинні використовувати цей інструмент відповідно до Умов використання кар'єрних порталів, з якими взаємодієте (Greenhouse, Lever, Workday, LinkedIn тощо). Не використовуйте цей інструмент для спаму роботодавців або перевантаження ATS-систем.
4. **Без гарантій.** Оцінки — це рекомендації, а не істина. AI-моделі можуть вигадувати навички або досвід. Автори не несуть відповідальності за результати працевлаштування, відхилені заявки, обмеження облікових записів чи будь-які інші наслідки.

Дивіться [LEGAL_DISCLAIMER.md](LEGAL_DISCLAIMER.md) за повною інформацією. Це програмне забезпечення надається за [ліцензією MIT](LICENSE) "як є", без будь-яких гарантій.

## Контриб'ютори

<a href="https://github.com/05-deepak-patidar/Seekiee/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=seekiee/seekiee" alt="Контриб'ютори seekiee/seekiee" />
</a>

Отримали роботу завдяки seekiee? [Поділіться своєю історією!](https://github.com/05-deepak-patidar/Seekiee/issues/new?template=i-got-hired.yml)

## Ліцензія

MIT

## Контакти

[![Вебсайт](https://img.shields.io/badge/darkiee.com-000?style=for-the-badge&logo=safari&logoColor=white)](https://darkiee.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seekiee)
[![X](https://img.shields.io/badge/X-000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/seekiee)
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/8pRpHETxa4)
[![Email](https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:hello@darkiee.com)
[![Пригостити кавою](https://img.shields.io/badge/Buy_Me_a_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/seekiee)
