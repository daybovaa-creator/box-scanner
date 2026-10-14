"""
Тестовый скрипт для загрузки данных напрямую в БД
"""
import sys
sys.path.append('.')

from database import SessionLocal, init_db, Product as DBProduct
from utils.csv_parser import parse_supplier_csv, parse_ozon_csv

# Инициализация БД
init_db()
db = SessionLocal()

# 1. Загрузка товаров от поставщика
print("=== Загрузка товаров от поставщика ===")
supplier_file = r'C:\Users\user\Downloads\Эл-Би Андрею.xlsx - TDSheet.csv'
products_data = parse_supplier_csv(supplier_file)
print(f"Найдено {len(products_data)} товаров")

created = 0
updated = 0

for prod_data in products_data:
    existing = db.query(DBProduct).filter(DBProduct.article == prod_data['article']).first()

    if existing:
        existing.barcode_manufacturer = prod_data['barcode_manufacturer']
        if not existing.name or existing.name == '':
            existing.name = prod_data['name']
        updated += 1
    else:
        new_product = DBProduct(**prod_data)
        db.add(new_product)
        created += 1

db.commit()
print(f"Создано: {created}, Обновлено: {updated}")

# 2. Загрузка товаров от Ozon
print("\n=== Загрузка товаров от Ozon ===")
ozon_file = r'C:\Users\user\Downloads\Штрихкоды товаров_14.10.2026.xlsx - Штрихкоды.csv'
try:
    products_data = parse_ozon_csv(ozon_file)
    print(f"Найдено {len(products_data)} товаров")

    created = 0
    updated = 0

    for prod_data in products_data:
        try:
            existing = db.query(DBProduct).filter(DBProduct.article == prod_data['article']).first()

            if existing:
                existing.barcode_ozon = prod_data['barcode_ozon']
                existing.ozon_id = prod_data['ozon_id']
                if not existing.name or existing.name == '':
                    existing.name = prod_data['name']
                db.commit()  # Коммитим сразу
                updated += 1
            else:
                new_product = DBProduct(**prod_data)
                db.add(new_product)
                db.commit()  # Коммитим сразу
                created += 1
        except Exception as e:
            db.rollback()
            print(f"Пропуск {prod_data.get('article', 'unknown')}: {str(e)[:80]}")
            continue
    print(f"Создано: {created}, Обновлено: {updated}")
except Exception as e:
    print(f"Ошибка: {e}")
    db.rollback()

# Статистика
print("\n=== Статистика ===")
total_products = db.query(DBProduct).count()
with_manufacturer_barcode = db.query(DBProduct).filter(DBProduct.barcode_manufacturer.isnot(None)).count()
with_ozon_barcode = db.query(DBProduct).filter(DBProduct.barcode_ozon.isnot(None)).count()

print(f"Всего товаров в БД: {total_products}")
print(f"С ШК производителя: {with_manufacturer_barcode}")
print(f"С ШК Ozon: {with_ozon_barcode}")

print("\nReady! Data loaded to DB.")

db.close()
