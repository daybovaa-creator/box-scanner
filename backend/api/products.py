from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_db, Product as DBProduct
from models import Product, ProductCreate
from utils.csv_parser import parse_ozon_csv, parse_supplier_csv

router = APIRouter(prefix="/api/products", tags=["products"])


@router.post("/upload/ozon")
async def upload_ozon_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Загрузить CSV с товарами от Ozon (Штрихкоды товаров)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Только CSV файлы")

    # Сохраняем временно (Windows-совместимый путь)
    import tempfile
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        temp_path = tmp_file.name

    try:
        products_data = parse_ozon_csv(temp_path)

        created = 0
        updated = 0

        for prod_data in products_data:
            # Ищем товар по артикулу
            existing = db.query(DBProduct).filter(DBProduct.article == prod_data['article']).first()

            if existing:
                # Обновляем существующий
                existing.barcode_ozon = prod_data['barcode_ozon']
                existing.ozon_id = prod_data['ozon_id']
                if not existing.name or existing.name == '':
                    existing.name = prod_data['name']
                updated += 1
            else:
                # Создаём новый
                new_product = DBProduct(**prod_data)
                db.add(new_product)
                created += 1

        db.commit()

        return {
            "success": True,
            "created": created,
            "updated": updated,
            "total": len(products_data)
        }

    finally:
        os.remove(temp_path)


@router.post("/upload/supplier")
async def upload_supplier_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Загрузить CSV от поставщика (Эл-Би Андрею)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Только CSV файлы")

    # Сохраняем временно (Windows-совместимый путь)
    import tempfile
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        temp_path = tmp_file.name

    try:
        products_data = parse_supplier_csv(temp_path)

        created = 0
        updated = 0

        for prod_data in products_data:
            existing = db.query(DBProduct).filter(DBProduct.article == prod_data['article']).first()

            if existing:
                # Обновляем ШК производителя
                existing.barcode_manufacturer = prod_data['barcode_manufacturer']
                if not existing.name or existing.name == '':
                    existing.name = prod_data['name']
                updated += 1
            else:
                # Создаём новый
                new_product = DBProduct(**prod_data)
                db.add(new_product)
                created += 1

        db.commit()

        return {
            "success": True,
            "created": created,
            "updated": updated,
            "total": len(products_data)
        }

    finally:
        os.remove(temp_path)


@router.get("/search")
async def search_by_barcode(barcode: str, db: Session = Depends(get_db)):
    """
    Найти товар по штрихкоду (производителя или Ozon)
    """
    product = db.query(DBProduct).filter(
        (DBProduct.barcode_manufacturer == barcode) |
        (DBProduct.barcode_ozon == barcode)
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")

    # Находим в каких коробках лежит
    from database import BoxItem, Box
    locations = db.query(Box.code, BoxItem.quantity).join(
        BoxItem, Box.id == BoxItem.box_id
    ).filter(BoxItem.product_id == product.id).all()

    return {
        "product": product,
        "locations": [{"box_code": loc[0], "quantity": loc[1]} for loc in locations]
    }


@router.get("/{article}")
async def get_product_by_article(article: str, db: Session = Depends(get_db)):
    """
    Получить товар по артикулу
    """
    product = db.query(DBProduct).filter(DBProduct.article == article).first()
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product


@router.post("/manual", response_model=Product)
async def create_product_manual(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Создать товар вручную (для товаров не в Ozon)
    """
    # Проверяем что артикула ещё нет
    existing = db.query(DBProduct).filter(DBProduct.article == product.article).first()
    if existing:
        raise HTTPException(status_code=400, detail="Товар с таким артикулом уже существует")

    db_product = DBProduct(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/", response_model=List[Product])
async def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех товаров
    """
    products = db.query(DBProduct).offset(skip).limit(limit).all()
    return products
