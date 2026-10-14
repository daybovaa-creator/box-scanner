# Box Scanner — Система локации товаров

Быстрая система для отслеживания товаров по коробкам на складе.

## Что делает

1. **Инвентаризация** — сканируешь коробку, добавляешь товары по ШК
2. **Поиск** — сканируешь ШК товара → видишь в какой коробке лежит
3. **Сборка** — загружаешь артикулы из Ozon → система показывает маршрут по коробкам

## Технологии

- **Backend**: Python FastAPI + SQLite
- **Frontend**: HTML + Vanilla JS + PWA (работает как приложение на телефоне)
- **Сканирование**: HTML5 QR Code Scanner (камера телефона)

## Структура

```
box-scanner/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLite подключение
│   ├── models.py            # Pydantic модели
│   ├── api/
│   │   ├── products.py      # Загрузка CSV товаров
│   │   ├── boxes.py         # CRUD коробок
│   │   └── assembly.py      # Сборочные листы
│   └── utils/
│       ├── csv_parser.py    # Парсинг CSV
│       └── qr_generator.py  # Генерация QR
├── frontend/
│   ├── index.html           # Главное меню
│   ├── admin.html           # Загрузка данных
│   ├── box.html             # Коробка
│   ├── search.html          # Поиск по ШК
│   ├── assembly.html        # Сборочный лист
│   ├── app.js
│   └── style.css
└── data/
    └── scanner.db           # SQLite база
```

## Запуск

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```

API будет доступен на `http://localhost:8000`

### Frontend
Открой `frontend/index.html` в браузере или запусти через GitHub Pages.

## Деплой

- **Backend**: на твоём сервере (рядом с мессенджером)
- **Frontend**: GitHub Pages или на том же сервере
