import pandas as pd
from typing import List, Dict


def parse_ozon_csv(file_path: str) -> List[Dict]:
    """
    Парсит CSV от Ozon (Штрихкоды товаров)
    Возвращает список товаров с полями: article, name, barcode_ozon, ozon_id
    """
    try:
        # Читаем начиная со строки 2 (пропускаем первую пустую)
        df = pd.read_csv(file_path, encoding='utf-8', skiprows=1)
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='cp1251', skiprows=1)

    # Удаляем строки-инструкции (первые 4 строки после заголовка)
    df = df[df['Артикул'].notna()]
    df = df[~df['Артикул'].str.contains('Нередактируемое|Уникальный идентификатор', na=False)]

    products = []
    for _, row in df.iterrows():
        try:
            article = str(row['Артикул']).strip()
            if not article or article == 'nan':
                continue

            # Штрихкод Ozon может быть в виде числа
            barcode_ozon = None
            if pd.notna(row['Штрихкод']) and str(row['Штрихкод']).strip():
                barcode_raw = row['Штрихкод']
                if isinstance(barcode_raw, (int, float)):
                    barcode_ozon = str(int(barcode_raw)) if barcode_raw == barcode_raw else None  # Проверка на NaN
                else:
                    barcode_ozon = str(barcode_raw).strip()

            # Ozon Product ID тоже может быть числом
            ozon_id = None
            if pd.notna(row['Ozon Product ID']):
                ozon_id_raw = row['Ozon Product ID']
                if isinstance(ozon_id_raw, (int, float)):
                    ozon_id = str(int(ozon_id_raw)) if ozon_id_raw == ozon_id_raw else None
                else:
                    ozon_id = str(ozon_id_raw).strip()

            product = {
                'article': article,
                'name': str(row['Название товара']).strip(),
                'barcode_ozon': barcode_ozon,
                'ozon_id': ozon_id,
                'source': 'ozon'
            }
            products.append(product)
        except Exception as e:
            print(f"Error parsing row: {e}")
            continue

    return products


def parse_supplier_csv(file_path: str) -> List[Dict]:
    """
    Парсит CSV от поставщика (Эл-Би Андрею)
    Возвращает список товаров с полями: article, name, barcode_manufacturer
    """
    try:
        # Читаем начиная со строки 7 (заголовок на строке 7, данные с 8)
        df = pd.read_csv(file_path, encoding='utf-8', skiprows=6)
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='cp1251', skiprows=6)

    products = []
    for _, row in df.iterrows():
        try:
            # Артикул в колонке B (index 1)
            article = str(row.iloc[1]).strip() if pd.notna(row.iloc[1]) else ''

            # Пропускаем пустые строки и заголовки
            if not article or article == '' or article == 'nan' or article == 'Артикул':
                continue

            # Название в колонке D (index 3)
            name = str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else ''

            # Штрихкод в колонке G (index 6)
            barcode = None
            if pd.notna(row.iloc[6]):
                barcode_raw = row.iloc[6]
                # Если число, конвертируем в int, затем в string
                if isinstance(barcode_raw, float):
                    barcode = str(int(barcode_raw))
                else:
                    barcode = str(barcode_raw).strip()

                if barcode and (barcode == 'nan' or barcode == '' or barcode == 'Штрихкод'):
                    barcode = None

            product = {
                'article': article,
                'name': name,
                'barcode_manufacturer': barcode,
                'source': 'supplier'
            }
            products.append(product)
        except Exception as e:
            print(f"Error parsing row: {e}")
            continue

    return products
