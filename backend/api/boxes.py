from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import get_db, Box as DBBox, BoxItem as DBBoxItem, Product as DBProduct
from models import Box, BoxCreate, BoxWithItems, BoxItemCreate, BoxItemResponse
from utils.qr_generator import generate_qr_code

router = APIRouter(prefix="/api/boxes", tags=["boxes"])


@router.post("/generate/{count}")
async def generate_boxes(count: int, db: Session = Depends(get_db)):
    """
    Создать N коробок с QR-кодами
    """
    if count < 1 or count > 1000:
        raise HTTPException(status_code=400, detail="Количество должно быть от 1 до 1000")

    # Находим последний номер коробки
    last_box = db.query(DBBox).order_by(DBBox.id.desc()).first()
    start_num = 1
    if last_box:
        # Извлекаем номер из кода типа "BOX-001"
        try:
            start_num = int(last_box.code.split('-')[1]) + 1
        except:
            start_num = 1

    created_boxes = []
    for i in range(count):
        box_num = start_num + i
        code = f"BOX-{box_num:03d}"  # BOX-001, BOX-002, ...

        # Генерируем QR-код
        qr_code = generate_qr_code(code)

        box = DBBox(code=code, qr_code=qr_code)
        db.add(box)
        created_boxes.append({"code": code, "qr_code": qr_code})

    db.commit()

    return {
        "success": True,
        "count": count,
        "boxes": created_boxes
    }


@router.get("/{code}", response_model=BoxWithItems)
async def get_box(code: str, db: Session = Depends(get_db)):
    """
    Получить коробку с содержимым
    """
    box = db.query(DBBox).filter(DBBox.code == code).first()
    if not box:
        raise HTTPException(status_code=404, detail="Коробка не найдена")

    # Получаем содержимое с товарами
    items = db.query(DBBoxItem).filter(DBBoxItem.box_id == box.id).all()

    items_response = []
    for item in items:
        product = db.query(DBProduct).filter(DBProduct.id == item.product_id).first()
        items_response.append({
            "id": item.id,
            "quantity": item.quantity,
            "product": product,
            "added_at": item.added_at
        })

    return {
        "id": box.id,
        "code": box.code,
        "qr_code": box.qr_code,
        "created_at": box.created_at,
        "items": items_response
    }


@router.post("/{code}/items")
async def add_item_to_box(code: str, item: BoxItemCreate, db: Session = Depends(get_db)):
    """
    Добавить товар в коробку
    """
    # Находим коробку
    box = db.query(DBBox).filter(DBBox.code == code).first()
    if not box:
        raise HTTPException(status_code=404, detail="Коробка не найдена")

    # Находим товар по артикулу
    product = db.query(DBProduct).filter(DBProduct.article == item.article).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Товар с артикулом {item.article} не найден")

    # Проверяем есть ли уже этот товар в коробке
    existing_item = db.query(DBBoxItem).filter(
        DBBoxItem.box_id == box.id,
        DBBoxItem.product_id == product.id
    ).first()

    if existing_item:
        # Увеличиваем количество
        existing_item.quantity += item.quantity
    else:
        # Создаём новую запись
        new_item = DBBoxItem(
            box_id=box.id,
            product_id=product.id,
            quantity=item.quantity
        )
        db.add(new_item)

    db.commit()

    return {"success": True, "message": f"Товар {item.article} добавлен в {code}"}


@router.delete("/{code}/items/{item_id}")
async def remove_item_from_box(code: str, item_id: int, db: Session = Depends(get_db)):
    """
    Удалить товар из коробки
    """
    box = db.query(DBBox).filter(DBBox.code == code).first()
    if not box:
        raise HTTPException(status_code=404, detail="Коробка не найдена")

    item = db.query(DBBoxItem).filter(
        DBBoxItem.id == item_id,
        DBBoxItem.box_id == box.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Товар не найден в коробке")

    db.delete(item)
    db.commit()

    return {"success": True, "message": "Товар удалён"}


@router.get("/", response_model=List[Box])
async def list_boxes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Получить список всех коробок
    """
    boxes = db.query(DBBox).offset(skip).limit(limit).all()
    return boxes
