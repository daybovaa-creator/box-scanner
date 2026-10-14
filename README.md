# 📦 Box Scanner

**Система локации товаров на складе** — быстрый поиск через штрихкоды и QR-коды коробок

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://daybovaa-creator.github.io/box-scanner/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-PWA-5A0FC8)](https://web.dev/progressive-web-apps/)

---

## 🎯 Проблема

У тебя много мелкого товара, разбросанного по коробкам. Сборщики тратят часы на поиск нужных позиций.

## ✅ Решение

1. **Инвентаризация** — отсканируй коробку, добавь товары по штрихкоду
2. **Поиск** — отсканируй ШК товара → система покажет в какой коробке лежит
3. **Сборка** — загрузи артикулы из Ozon → получи маршрут по коробкам

---

## 🚀 Возможности

### 📥 Загрузка данных
- Импорт CSV от поставщика (штрихкоды производителя)
- Импорт CSV от Ozon (штрихкоды маркетплейса)
- Автоматическое связывание товаров

### 📦 Коробки
- Генерация QR-кодов для коробок
- Быстрое сканирование камерой телефона
- Просмотр содержимого по QR

### 🔍 Поиск
- Поиск по штрихкоду производителя
- Поиск по штрихкоду Ozon
- Показывает все коробки с товаром

### 📋 Сборка заказов
- Загрузка артикулов из сборочного листа Ozon
- Маршрут сборки по коробкам
- Отметка собранных позиций

### 📱 PWA
- Работает как приложение на телефоне
- Камера для сканирования
- Offline-ready (после первого запуска)

---

## 🛠️ Технологии

**Backend:**
- Python 3.12
- FastAPI — быстрый веб-фреймворк
- SQLite — простая БД
- SQLAlchemy — ORM
- Pandas — парсинг CSV
- QRCode — генерация QR-кодов

**Frontend:**
- HTML5 + Vanilla JavaScript
- PWA (Progressive Web App)
- html5-qrcode — сканирование камерой
- Адаптивный дизайн

---

## 📥 Установка

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

API будет доступен на `http://localhost:8000`

### Frontend

Открой `frontend/index.html` в браузере или:

```bash
cd frontend
python -m http.server 3000
```

Открой `http://localhost:3000`

---

## 🎬 Быстрый старт

### 1. Загрузи товары

Открой админку → Загрузи CSV файлы:
- От поставщика (ШК производителя)
- От Ozon (ШК маркетплейса)

### 2. Создай коробки

Админка → "Создать коробки" → Укажи количество → Распечатай QR-коды

### 3. Инвентаризация

Коробка → Сканируй QR → Сканируй ШК товаров → Система сама определит товар

### 4. Поиск

Поиск → Сканируй ШК → Увидишь в каких коробках лежит

### 5. Сборка

Сборка → Вставь артикулы из Ozon → Получи маршрут по коробкам

---

## 📱 Использование на телефоне

**Demo:** https://daybovaa-creator.github.io/box-scanner/

1. Открой ссылку в Safari/Chrome
2. "Добавить на главный экран"
3. Приложение готово к работе!

---

## 🚀 Деплой

Подробная инструкция в [DEPLOY.md](DEPLOY.md)

**Кратко:**

1. Backend на сервер через systemd
2. Frontend уже на GitHub Pages
3. Настроить nginx + SSL
4. Изменить API_BASE в frontend

---

## 📊 Структура проекта

```
box-scanner/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite models
│   ├── models.py            # Pydantic schemas
│   ├── api/
│   │   ├── products.py      # Загрузка товаров
│   │   ├── boxes.py         # Коробки
│   │   └── assembly.py      # Сборочные листы
│   └── utils/
│       ├── csv_parser.py    # Парсинг CSV
│       └── qr_generator.py  # Генерация QR
├── frontend/
│   ├── index.html           # Главная
│   ├── admin.html           # Админка
│   ├── box.html             # Коробка
│   ├── search.html          # Поиск
│   ├── assembly.html        # Сборка
│   ├── app.js               # JS логика
│   └── style.css            # Стили
└── docs/                    # GitHub Pages (копия frontend)
```

---

## 🔗 API Endpoints

```
POST   /api/products/upload/supplier    # Загрузить CSV от поставщика
POST   /api/products/upload/ozon        # Загрузить CSV от Ozon
GET    /api/products/search?barcode=    # Найти товар по ШК
POST   /api/boxes/generate/{count}      # Создать N коробок
GET    /api/boxes/{code}                # Получить коробку
POST   /api/boxes/{code}/items          # Добавить товар в коробку
POST   /api/assembly                    # Создать сборочный лист
POST   /api/assembly/{id}/items         # Добавить артикулы
GET    /api/assembly/{id}/route         # Получить маршрут сборки
```

Swagger UI: `http://localhost:8000/docs`

---

## 🤝 Контрибьюции

Пулл-реквесты приветствуются! Для больших изменений сначала создай issue.

---

## 📝 Лицензия

MIT

---

## 👨‍💻 Автор

Created with [Claude Code](https://claude.ai/code)

---

**⭐ Если проект помог — поставь звезду!**
