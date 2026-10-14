# 🚀 Деплой Box Scanner на сервер

## Репозиторий
https://github.com/daybovaa-creator/box-scanner

## Frontend (GitHub Pages)
https://daybovaa-creator.github.io/box-scanner/

---

## 📦 Деплой Backend на сервер

### 1. Клонировать репозиторий

```bash
cd /var/www  # или куда угодно
git clone https://github.com/daybovaa-creator/box-scanner.git
cd box-scanner/backend
```

### 2. Установить зависимости

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Загрузить данные (первый раз)

Скопируй CSV файлы на сервер:
```bash
scp "C:\Users\user\Downloads\Эл-Би Андрею.xlsx - TDSheet.csv" user@server:/tmp/supplier.csv
scp "C:\Users\user\Downloads\Штрихкоды товаров_14.10.2026.xlsx - Штрихкоды.csv" user@server:/tmp/ozon.csv
```

Измени пути в `load_data.py`:
```python
supplier_file = '/tmp/supplier.csv'
ozon_file = '/tmp/ozon.csv'
```

Запусти загрузку:
```bash
python load_data.py
```

### 4. Настроить systemd service

```bash
sudo nano /etc/systemd/system/box-scanner.service
```

Содержимое:
```ini
[Unit]
Description=Box Scanner API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/box-scanner/backend
Environment="PATH=/var/www/box-scanner/backend/venv/bin"
ExecStart=/var/www/box-scanner/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Запустить:
```bash
sudo systemctl daemon-reload
sudo systemctl enable box-scanner
sudo systemctl start box-scanner
sudo systemctl status box-scanner
```

### 5. Настроить Nginx

```bash
sudo nano /etc/nginx/sites-available/box-scanner
```

Содержимое:
```nginx
server {
    listen 80;
    server_name box-scanner.yourdomain.com;  # Твой домен

    # API Backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000;
    }

    # Для Swagger UI (опционально)
    location /docs {
        proxy_pass http://localhost:8000;
    }
}
```

Активировать:
```bash
sudo ln -s /etc/nginx/sites-available/box-scanner /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Настроить SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d box-scanner.yourdomain.com
```

---

## 🌐 Настроить Frontend

### Вариант 1: GitHub Pages (уже работает)

URL: https://daybovaa-creator.github.io/box-scanner/

Нужно только изменить API URL в `docs/app.js`:
```javascript
const API_BASE = 'https://box-scanner.yourdomain.com';  // Твой домен
```

Закоммитить и запушить:
```bash
git commit -am "Update API URL to production server"
git push
```

### Вариант 2: На том же сервере (Nginx)

Добавить в nginx конфиг:
```nginx
server {
    listen 80;
    server_name box-scanner.yourdomain.com;

    # Frontend (Static files)
    location / {
        root /var/www/box-scanner/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:8000;
        # ... (как выше)
    }
}
```

---

## 📱 Использование

1. Открой https://daybovaa-creator.github.io/box-scanner/ на телефоне
2. Нажми "Добавить на главный экран"
3. Приложение установится как PWA
4. Камера будет работать для сканирования!

---

## 🔧 Обновление кода

```bash
cd /var/www/box-scanner
git pull
sudo systemctl restart box-scanner
```

---

## 📊 Проверка работы

```bash
# Проверка API
curl https://box-scanner.yourdomain.com/health

# Логи backend
sudo journalctl -u box-scanner -f

# Логи nginx
sudo tail -f /var/log/nginx/access.log
```

---

## 🎯 TODO после деплоя

- [ ] Залить backend на сервер
- [ ] Настроить nginx + SSL
- [ ] Изменить API_BASE в `docs/app.js` на боевой URL
- [ ] Запушить изменения
- [ ] Создать 50-100 коробок через админку
- [ ] Распечатать QR-коды
- [ ] Начать инвентаризацию!
