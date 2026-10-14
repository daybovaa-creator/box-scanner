# 🚀 Быстрый старт Box Scanner

## Система запущена! ✅

Backend API работает на `http://localhost:8000`

---

## 📋 Следующие шаги

### 1. Загрузка товаров

Откройте в браузере: `frontend/admin.html`

**Загрузите товары от поставщика:**
- Файл: `C:\Users\user\Downloads\Эл-Би Андрею.xlsx - TDSheet.csv`
- Содержит: артикулы, названия, штрихкоды производителя

**Загрузите товары от Ozon:**
- Файл: `C:\Users\user\Downloads\Штрихкоды товаров_14.10.2026.xlsx - Штрихкоды.csv`
- Содержит: артикулы, названия, штрихкоды Ozon

### 2. Создание коробок

В админке (`admin.html`):
- Нажмите "Создать коробки"
- Укажите количество (например, 50)
- Скачайте/распечатайте QR-коды
- Наклейте на физические коробки

### 3. Инвентаризация

Откройте `frontend/box.html` на телефоне:
1. Отсканируйте QR коробки
2. Сканируйте штрихкоды товаров
3. Система автоматически определит товар
4. Укажите количество → сохранить

### 4. Поиск товара

Откройте `frontend/search.html`:
- Сканируйте ШК товара
- Система покажет в каких коробках он лежит

### 5. Сборка заказов

Откройте `frontend/assembly.html`:
1. Скопируйте артикулы из PDF Ozon
2. Вставьте в поле
3. Система сформирует маршрут сборки по коробкам

---

## 🌐 Деплой

### Backend (на сервер)

```bash
# На сервере (рядом с мессенджером)
cd /path/to/box-scanner/backend
pip install -r requirements.txt

# Запуск
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Или через systemd (автозапуск)
sudo nano /etc/systemd/system/box-scanner.service
```

**box-scanner.service:**
```ini
[Unit]
Description=Box Scanner API
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/box-scanner/backend
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable box-scanner
sudo systemctl start box-scanner
```

### Frontend (GitHub Pages или сервер)

**Вариант 1: GitHub Pages**
```bash
cd /c/Projects/box-scanner
git init
git add .
git commit -m "Initial commit: Box Scanner"
git branch -M main
git remote add origin https://github.com/your-username/box-scanner.git
git push -u origin main

# В настройках репозитория: Settings → Pages → Source: main/frontend
```

**Вариант 2: Nginx на сервере**
```nginx
server {
    listen 80;
    server_name box-scanner.yourdomain.com;

    root /path/to/box-scanner/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy для API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Изменить URL API во frontend

В `frontend/app.js` измените:
```javascript
const API_BASE = 'http://localhost:8000';
```
на:
```javascript
const API_BASE = 'https://your-domain.com';  // Ваш сервер
```

---

## 📱 Использование на телефоне

1. Откройте `https://your-domain.com` в браузере
2. Нажмите "Добавить на главный экран" (PWA)
3. Приложение установится как нативное
4. Камера будет работать для сканирования

---

## 🔧 Разработка

**Запуск локально для тестирования:**

Terminal 1 (Backend):
```bash
cd C:\Projects\box-scanner\backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 (Frontend):
```bash
cd C:\Projects\box-scanner\frontend
python -m http.server 3000
# Откройте http://localhost:3000
```

---

## 📊 API Документация

Swagger UI: `http://localhost:8000/docs`
ReDoc: `http://localhost:8000/redoc`

---

## Готово! 🎉

Система полностью работает. Можно начинать использовать!
